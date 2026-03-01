import prisma from './prisma';

/**
 * Checks if the user's lastActive date is from a previous day.
 * If so, processes missed daily tasks (applies HP damage, breaks streaks),
 * resets completedAt for all dailies, and updates lastActive.
 */
export async function processDailyReset(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { tasks: true }
        });

        if (!user) return null;

        const now = new Date();
        const lastActive = new Date(user.lastActive);

        // Reset occurs at midnight local time.
        // We compare the date strings (YYYY-MM-DD) to see if it's a new day.
        const todayStr = now.toLocaleDateString('en-CA'); // e.g. "2026-02-28"
        const lastActiveStr = lastActive.toLocaleDateString('en-CA');

        if (todayStr === lastActiveStr) {
            // Already processed today
            return user;
        }

        console.log(`[Daily Reset] Processing reset for user ${user.username}...`);

        // Find missed dailies (type: 'daily', not completed since last reset)
        // A daily is "missed" if it was not completed on the last active day.
        const missedDailies = user.tasks.filter(t =>
            t.type === 'daily' && !t.completedAt
        );

        let damage = 0;
        let tasksToUpdate: any[] = [];

        for (const daily of missedDailies) {
            damage += daily.healthPenaltyIfMissed;
            tasksToUpdate.push(
                prisma.task.update({
                    where: { id: daily.id },
                    data: { streak: 0 } // Break streak
                })
            );
            console.log(`[Daily Reset] Missed daily: "${daily.title}". Penalty: ${daily.healthPenaltyIfMissed}`);
        }

        // We also need to reset `completedAt` to null for ALL dailies so they can be done today
        const allDailies = user.tasks.filter(t => t.type === 'daily');
        for (const daily of allDailies) {
            // Only update if it's currently marked as completed, to save DB calls
            if (daily.completedAt) {
                tasksToUpdate.push(
                    prisma.task.update({
                        where: { id: daily.id },
                        data: { completedAt: null }
                    })
                );
            }
        }

        // Apply damage and update lastActive
        const newHealth = Math.max(0, user.health - damage);

        // Execute all updates in a transaction
        const [, updatedUser] = await prisma.$transaction([
            ...tasksToUpdate,
            prisma.user.update({
                where: { id: user.id },
                data: {
                    health: newHealth,
                    lastActive: now,
                }
            })
        ]);

        if (damage > 0) {
            console.log(`[Daily Reset] User ${user.username} took ${damage} damage from missed dailies.`);
        }

        return updatedUser;
    } catch (error) {
        console.error('[Daily Reset] Error processing daily reset:', error);
        return null;
    }
}
