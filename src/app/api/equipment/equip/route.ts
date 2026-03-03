import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EQUIPMENT_DATABASE } from '@/lib/equipment';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, itemId } = body;

        if (!userId || !itemId) {
            return NextResponse.json({ error: 'Missing userId or itemId' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify ownership
        if (!user.inventory.includes(itemId)) {
            return NextResponse.json({ error: 'User does not own this item' }, { status: 403 });
        }

        // Verify class restriction
        const itemInfo = EQUIPMENT_DATABASE[itemId];
        if (!itemInfo) {
            return NextResponse.json({ error: 'Invalid item ID' }, { status: 404 });
        }

        if (itemInfo.classRestriction !== user.class) {
            return NextResponse.json({ error: 'Item restricts class' }, { status: 403 });
        }

        // Equip into the correct slot
        const slotUpdate: Record<string, string> = {};
        if (itemInfo.slot === 'head') slotUpdate.equippedHead = itemId;
        if (itemInfo.slot === 'body') slotUpdate.equippedBody = itemId;
        if (itemInfo.slot === 'legs') slotUpdate.equippedLegs = itemId;
        if (itemInfo.slot === 'weapon') slotUpdate.equippedWeapon = itemId;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: slotUpdate
        });

        return NextResponse.json(updatedUser);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
