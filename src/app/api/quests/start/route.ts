import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, monsterId } = body;

        if (!userId || !monsterId) {
            return NextResponse.json({ error: 'userId and monsterId are required' }, { status: 400 });
        }

        const monster = await prisma.monster.findUnique({ where: { id: monsterId } });

        if (!monster) {
            return NextResponse.json({ error: 'Monster not found' }, { status: 404 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                activeMonsterId: monster.id,
                activeMonsterHealth: monster.maxHealth
            },
            include: { activeMonster: true }
        });

        return NextResponse.json(updatedUser, { status: 200 });

    } catch (error) {
        console.error('Error starting quest:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
