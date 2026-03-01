import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all custom rewards for a user
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const rewards = await prisma.customReward.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(rewards);
    } catch (error) {
        console.error('Error fetching custom rewards:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new custom reward
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, title, cost, icon } = body;

        if (!userId || !title || !cost) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newReward = await prisma.customReward.create({
            data: {
                userId,
                title,
                cost: parseInt(cost),
                icon: icon || '🎁'
            }
        });

        return NextResponse.json(newReward);
    } catch (error) {
        console.error('Error creating custom reward:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE a custom reward
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'reward id is required' }, { status: 400 });
        }

        await prisma.customReward.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting custom reward:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
