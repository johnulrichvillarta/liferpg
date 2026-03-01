import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to select a weighted random sample of monsters based on player level
function getWeightedSample(monsters: any[], count: number, userLevel: number) {
    if (monsters.length <= count) return [...monsters];

    // Weight each monster based on how close its minLevel is to the userLevel
    const weighted = monsters.map(m => {
        const diff = Math.abs(userLevel - m.minLevel);
        // Base weight 100. Decreases as the level difference grows
        let weight = Math.max(1, 100 - (diff * 8));
        return { item: m, weight };
    });

    const selected = [];
    for (let i = 0; i < count; i++) {
        if (weighted.length === 0) break;
        let totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
        let random = Math.random() * totalWeight;

        for (let j = 0; j < weighted.length; j++) {
            random -= weighted[j].weight;
            if (random <= 0) {
                selected.push(weighted[j].item);
                weighted.splice(j, 1);
                break;
            }
        }
    }

    return selected.sort((a, b) => a.minLevel - b.minLevel);
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { level: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Progression Thresholds defining "Teaser" bounds
        let maxVisibleLevel = 4;
        if (user.level >= 5) maxVisibleLevel = 14;
        if (user.level >= 15) maxVisibleLevel = 29;
        if (user.level >= 30) maxVisibleLevel = 44;
        if (user.level >= 45) maxVisibleLevel = 999;

        const allMonsters = await prisma.monster.findMany({
            orderBy: { minLevel: 'asc' },
            where: { minLevel: { lte: maxVisibleLevel + 5 } } // Exclude late-game entirely
        });

        // Random 4 unlocked (weighted towards player's level)
        const unlockedPool = allMonsters.filter(m => m.minLevel <= user.level).map(m => ({ ...m, locked: false }));
        // Random 2 locked teasers
        const lockedPool = allMonsters.filter(m => m.minLevel > user.level && m.minLevel <= maxVisibleLevel).map(m => ({ ...m, locked: true }));

        const selectedUnlocked = getWeightedSample(unlockedPool, 4, user.level);
        const selectedLocked = [...lockedPool].sort(() => 0.5 - Math.random()).slice(0, 2);

        return NextResponse.json([...selectedUnlocked, ...selectedLocked]);
    } catch (error) {
        console.error('Error fetching quests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
