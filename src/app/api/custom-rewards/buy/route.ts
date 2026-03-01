import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Attempt to purchase a custom reward
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, rewardId } = body;

        if (!userId || !rewardId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch user & reward securely inside a transaction to prevent race conditions
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            const reward = await tx.customReward.findUnique({ where: { id: rewardId } });

            if (!user) throw new Error('User not found');
            if (!reward) throw new Error('Reward not found');
            if (reward.userId !== user.id) throw new Error('Unauthorized');
            if (user.gold < reward.cost) throw new Error('Not enough gold');

            // 2. Deduct gold
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { gold: user.gold - reward.cost }
            });

            return { user: updatedUser, reward };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error buying custom reward:', error);
        if (error.message === 'Not enough gold' || error.message === 'Unauthorized' || error.message === 'User not found' || error.message === 'Reward not found') {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
