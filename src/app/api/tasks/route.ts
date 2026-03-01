import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const tasks = await prisma.task.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, title, description, type, difficulty } = body;

        if (!userId || !title || !type || !difficulty) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Determine Base Multiplier based on Difficulty
        let baseMultiplier = 1;
        switch (difficulty) {
            case 'easy': baseMultiplier = 0.5; break;
            case 'medium': baseMultiplier = 1; break;
            case 'hard': baseMultiplier = 2; break;
            case 'legendary': baseMultiplier = 5; break;
        }

        const xpReward = Math.round(10 * baseMultiplier);
        const goldReward = Math.round(5 * baseMultiplier);
        const manaReward = Math.round(2 * baseMultiplier);

        const task = await prisma.task.create({
            data: {
                title,
                description,
                type,
                difficulty,
                xpReward,
                goldReward,
                manaReward,
                userId
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
