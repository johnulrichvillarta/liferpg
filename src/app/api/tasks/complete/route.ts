import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { taskId } = body;

        if (!taskId) {
            return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
        }

        // 1. Fetch the Task and the linked User
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { user: { include: { activeMonster: true } } }
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        if (task.completedAt) {
            return NextResponse.json({ error: 'Task already completed' }, { status: 400 });
        }

        const user = task.user;

        // 2. Compute Rewards based on PRD formulas
        // Base XP Reward = Base XP * (1 + Discipline * 0.05)
        // Gold Reward = Base Gold * (1 + Charisma * 0.03)

        // For MVP phase 1, we pull the task's flat rewards and apply stat scaling
        const xpGained = Math.round(task.xpReward * (1 + (user.discipline * 0.05)));
        const goldGained = Math.round(task.goldReward * (1 + (user.charisma * 0.03)));

        let newXp = user.xp + xpGained;
        let newLevel = user.level;
        let xpToNextLevel = user.xpToNextLevel;
        let newMaxHealth = user.maxHealth;
        let newHealth = user.health;
        let newMaxMana = user.maxMana;
        let newMana = Math.min(user.maxMana, user.mana + task.manaReward);

        // 3. Level Up Logic
        // Level Up: +5 stat points (not implemented automatically yet), +10 health, +5 mana
        // Next level XP scaling: 100 * (1.2 ^ current_level)
        if (newXp >= xpToNextLevel) {
            newLevel += 1;
            newXp = newXp - xpToNextLevel; // Carry over XP
            xpToNextLevel = Math.round(100 * Math.pow(1.2, newLevel));

            newMaxHealth += 10;
            newHealth += 10;
            newMaxMana += 5;
            newMana += 5;
        }

        // 4. Combat Damage Logic Based on Class
        let damageToMonster = 0;

        switch (user.class) {
            case 'Warrior':
                // Damage = Strength * 2 + Random(1–5)
                damageToMonster = (user.strength * 2) + Math.floor(Math.random() * 5) + 1;
                break;
            case 'Mage':
                // Damage = Spell Power (Int*2+Lvl) + Mana Spent. We just do base scaling here.
                damageToMonster = (user.intelligence * 2) + newLevel;
                break;
            case 'Rogue':
                // Damage = Base Damage + CritChanceRoll
                const isCrit = Math.random() < (user.luck * 0.005);
                damageToMonster = 10 + (isCrit ? 20 : 0);
                break;
            case 'Paladin':
                damageToMonster = user.endurance + user.strength;
                break;
            default:
                damageToMonster = 10; // Fallback
        }

        // 5. Active Monster Combat Logic
        let enemyDefeated = false;
        let finalMonsterId = user.activeMonsterId;
        let finalMonsterHealth = user.activeMonsterHealth;
        let bonusXp = 0;
        let bonusGold = 0;

        if (user.activeMonsterId && user.activeMonsterHealth !== null && user.activeMonster) {
            finalMonsterHealth = Math.max(0, user.activeMonsterHealth - damageToMonster);

            if (finalMonsterHealth === 0) {
                enemyDefeated = true;
                finalMonsterId = null;
                finalMonsterHealth = null;

                // Grant massive kill bonus based on rarity
                switch (user.activeMonster.rarity) {
                    case 'common': bonusXp = 50; bonusGold = 25; break;
                    case 'rare': bonusXp = 150; bonusGold = 75; break;
                    case 'epic': bonusXp = 400; bonusGold = 200; break;
                    case 'legendary': bonusXp = 1000; bonusGold = 500; break;
                }

                newXp += bonusXp;

                // Reprocess level up in case bonus pushed us over
                if (newXp >= xpToNextLevel) {
                    newLevel += 1;
                    newXp = newXp - xpToNextLevel; // Carry over XP
                    xpToNextLevel = Math.round(100 * Math.pow(1.2, newLevel));

                    newMaxHealth += 10;
                    newHealth += 10;
                    newMaxMana += 5;
                    newMana += 5;
                }
            }
        }

        // 6. Transaction to completely update User and Task
        const [updatedTask, updatedUser] = await prisma.$transaction([
            prisma.task.update({
                where: { id: taskId },
                data: { completedAt: new Date(), streak: { increment: 1 } }
            }),
            prisma.user.update({
                where: { id: user.id },
                data: {
                    xp: newXp,
                    level: newLevel,
                    xpToNextLevel,
                    health: newHealth,
                    maxHealth: newMaxHealth,
                    mana: newMana,
                    maxMana: newMaxMana,
                    gold: user.gold + goldGained + bonusGold,
                    activeMonsterId: finalMonsterId,
                    activeMonsterHealth: finalMonsterHealth
                },
                include: { activeMonster: true }
            })
        ]);

        return NextResponse.json({
            message: 'Task completed successfully',
            rewards: {
                xp: xpGained,
                gold: goldGained,
                mana: task.manaReward,
                bonusXp,
                bonusGold
            },
            combat: {
                damageDealt: damageToMonster,
                enemyDefeated
            },
            user: updatedUser,
            task: updatedTask
        }, { status: 200 });

    } catch (error) {
        console.error('Error completing task:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
