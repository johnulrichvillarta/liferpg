import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PREFIXES = ['Corrupted', 'Shadow', 'Feral', 'Ancient', 'Toxic', 'Hollow', 'Cursed', 'Spectral', 'Dread', 'Raging'];
const CREATURES = ['Slime', 'Goblin', 'Wolf', 'Spider', 'Golem', 'Wraith', 'Hydra', 'Demon', 'Dragon', 'Titan'];
const SUFFIXES = ['of Procrastination', 'of Distraction', 'of Overthinking', 'of Burnout', 'the Time Waster', 'the Energy Drainer', 'of Doubt', 'the Unfocused'];

const LORES = [
    'A sticky nuisance that slows you down.',
    'It steals your attention when you need it most.',
    'A terrifying beast born from your neglected tasks.',
    'It feeds on your unread emails and untouched to-do lists.',
    'A towering behemoth of mounting pressure.',
    'It whispered excuses until it materialized into form.',
];

function getRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateMonsters(count: number) {
    const monsters = [];

    // We want to scale monsters from Level 1 up to Level ~50
    for (let i = 0; i < count; i++) {
        // Curve: exponential difficulty leaning towards lower tiers
        const difficultyProgress = Math.pow(i / count, 1.5); // 0.0 to 1.0

        let minLevel = Math.max(1, Math.floor(difficultyProgress * 50));

        let rarity = 'common';
        if (minLevel >= 5) rarity = 'uncommon';
        if (minLevel >= 15) rarity = 'rare';
        if (minLevel >= 30) rarity = 'epic';
        if (minLevel >= 45) rarity = 'legendary';

        const prefix = getRandom(PREFIXES);
        const creature = getRandom(CREATURES);
        const suffix = getRandom(SUFFIXES);
        const name = `${prefix} ${creature} ${suffix}`;

        const lore = getRandom(LORES);

        // Stats scale heavily with level
        const maxHealth = Math.floor(100 + (Math.pow(minLevel, 1.8) * 8));
        const attack = Math.floor(5 + (Math.pow(minLevel, 1.4) * 2));
        const defense = Math.floor(minLevel * 1.5);

        monsters.push({
            id: `m_${i}_${Date.now()}`,
            name,
            rarity,
            maxHealth,
            attack,
            defense,
            minLevel,
            lore
        });
    }

    // Always ensure we have some absolute basic level 1s so the player isn't locked out immediately
    monsters[0] = { ...monsters[0], name: 'Weak Slime', minLevel: 1, rarity: 'common', maxHealth: 50, attack: 3, defense: 0 };
    monsters[1] = { ...monsters[1], name: 'Lazy Goblin', minLevel: 1, rarity: 'common', maxHealth: 80, attack: 5, defense: 1 };
    monsters[2] = { ...monsters[2], name: 'Distracted Imp', minLevel: 2, rarity: 'common', maxHealth: 110, attack: 6, defense: 1 };

    return monsters;
}

async function main() {
    console.log('Clearing existing monsters...');
    await prisma.monster.deleteMany(); // Clear old cyclic 4

    console.log('Generating 100 new monsters...');
    const monsters = generateMonsters(100);

    let count = 0;
    for (const m of monsters) {
        await prisma.monster.create({
            data: m
        });
        count++;
    }

    console.log(`Successfully seeded ${count} level-scaled monsters.`);
}

main()
    .catch((e) => {
        console.error('Error seeding monsters:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
