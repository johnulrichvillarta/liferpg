import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { processDailyReset } from '@/lib/dailyReset';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        tasks: true,
        activeMonster: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Process daily resets (HP damage, missed streaks nullified)
    const updatedUser = await processDailyReset(user.id);
    if (updatedUser) {
      user = updatedUser as typeof user;
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, userClass = "Warrior" } = body;

    if (!username || !email) {
      return NextResponse.json({ error: 'Username and email are required' }, { status: 400 });
    }

    // Set class-specific starting stats
    let strength = 10, intelligence = 10, discipline = 10, endurance = 10, luck = 10, charisma = 10;

    switch (userClass) {
      case "Warrior":
        strength = 15; endurance = 12;
        break;
      case "Mage":
        intelligence = 15; discipline = 12;
        break;
      case "Rogue":
        luck = 15; charisma = 12;
        break;
      case "Paladin":
        endurance = 15; strength = 12;
        break;
    }

    // Assign Starter Equipment
    const c = userClass.toLowerCase();
    const starterGear = [
      `eq_${c}_head`,
      `eq_${c}_body`,
      `eq_${c}_legs`,
      `eq_${c}_weapon`
    ];

    const maxHealth = 50 + (endurance * 5);
    const maxMana = 30 + (intelligence * 4);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        class: userClass,
        health: maxHealth,
        maxHealth,
        mana: maxMana,
        maxMana,
        strength,
        intelligence,
        discipline,
        endurance,
        luck,
        charisma,
        equippedHead: starterGear[0],
        equippedBody: starterGear[1],
        equippedLegs: starterGear[2],
        equippedWeapon: starterGear[3],
        inventory: starterGear
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { email }
    });

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
