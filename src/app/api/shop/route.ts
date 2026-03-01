import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Static shop catalog — in a real app this would be seeded in the DB
const SHOP_ITEMS = [
    // Consumables
    { id: 'revive-potion', name: 'Revive Potion', category: 'consumable', description: 'Restore 50 HP instantly.', cost: 30, icon: '🧪', effect: { health: 50 } },
    { id: 'xp-scroll', name: 'XP Scroll', category: 'consumable', description: 'Grant 100 bonus XP.', cost: 50, icon: '📜', effect: { xp: 100 } },
    { id: 'mana-elixir', name: 'Mana Elixir', category: 'consumable', description: 'Restore 30 Mana instantly.', cost: 25, icon: '💧', effect: { mana: 30 } },
    // Weapons
    { id: 'iron-sword', name: 'Iron Sword', category: 'weapon', description: '+5 Strength permanently.', cost: 150, icon: '⚔️', effect: { strength: 5 } },
    { id: 'staff-of-focus', name: 'Staff of Focus', category: 'weapon', description: '+5 Intelligence permanently.', cost: 150, icon: '🪄', effect: { intelligence: 5 } },
    { id: 'lucky-dagger', name: "Rogue's Dagger", category: 'weapon', description: '+5 Luck permanently.', cost: 150, icon: '🗡️', effect: { luck: 5 } },
    // Armour
    { id: 'iron-shield', name: 'Iron Shield', category: 'armour', description: '+5 Endurance permanently.', cost: 120, icon: '🛡️', effect: { endurance: 5 } },
    { id: 'fur-cape', name: 'Fur Cape', category: 'armour', description: '+5 Discipline permanently.', cost: 120, icon: '🧥', effect: { discipline: 5 } },
    // Cosmetics (no effect, gold sink)
    { id: 'golden-aura', name: 'Golden Aura', category: 'cosmetic', description: 'A radiant golden glow surrounds you.', cost: 200, icon: '✨', effect: {} },
    { id: 'crimson-crown', name: 'Crimson Crown', category: 'cosmetic', description: 'Wear the crown of champions.', cost: 180, icon: '👑', effect: {} },
];

export async function GET() {
    return NextResponse.json(SHOP_ITEMS);
}

export async function POST(request: Request) {
    try {
        const { userId, itemId } = await request.json();
        if (!userId || !itemId) {
            return NextResponse.json({ error: 'userId and itemId are required' }, { status: 400 });
        }

        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (user.gold < item.cost) {
            return NextResponse.json({ error: 'Not enough gold!' }, { status: 400 });
        }

        // Apply effects
        const effect = item.effect as Record<string, number>;
        const updateData: Record<string, number> = { gold: user.gold - item.cost };

        if (effect.health) updateData.health = Math.min(user.maxHealth, user.health + effect.health);
        if (effect.mana) updateData.mana = Math.min(user.maxMana, user.mana + effect.mana);
        if (effect.xp) {
            updateData.xp = user.xp + effect.xp;
            // Check for level up
            if (updateData.xp >= user.xpToNextLevel) {
                updateData.xp = updateData.xp - user.xpToNextLevel;
                updateData.level = user.level + 1;
                updateData.xpToNextLevel = Math.round(100 * Math.pow(1.2, user.level + 1));
                updateData.maxHealth = user.maxHealth + 10;
                updateData.health = user.health + 10;
                updateData.maxMana = user.maxMana + 5;
            }
        }
        if (effect.strength) updateData.strength = user.strength + effect.strength;
        if (effect.intelligence) updateData.intelligence = user.intelligence + effect.intelligence;
        if (effect.luck) updateData.luck = user.luck + effect.luck;
        if (effect.endurance) updateData.endurance = user.endurance + effect.endurance;
        if (effect.discipline) updateData.discipline = user.discipline + effect.discipline;

        const updatedUser = await prisma.user.update({ where: { id: userId }, data: updateData });

        return NextResponse.json({ message: `Purchased ${item.name}!`, item, user: updatedUser });
    } catch (e) {
        console.error('Shop error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
