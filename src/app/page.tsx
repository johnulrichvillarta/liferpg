'use client';

import React, { useState, useEffect, useRef } from 'react';
import LeftColumn from '@/components/LeftColumn/LeftColumn';
import CenterColumn from '@/components/CenterColumn/CenterColumn';
import RightColumn from '@/components/RightColumn/RightColumn';
import ShopPanel from '@/components/ShopPanel/ShopPanel';
import ClassSelect from '@/components/ClassSelect/ClassSelect';
import QuestBoardModal from '@/components/QuestBoardModal/QuestBoardModal';
import styles from './page.module.css';

interface User {
    id: string;
    username: string;
    email: string;
    class: string;
    level: number;
    health: number;
    maxHealth: number;
    mana: number;
    maxMana: number;
    xp: number;
    xpToNextLevel: number;
    gold: number;
    strength?: number;
    intelligence?: number;
    discipline?: number;
    endurance?: number;
    luck?: number;
    charisma?: number;
    activeMonsterId?: string | null;
    activeMonsterHealth?: number | null;
    activeMonster?: Monster | null;
}

interface Task {
    id: string;
    title: string;
    description: string | null;
    type: string;
    difficulty: string;
    xpReward: number;
    goldReward: number;
    manaReward: number;
    streak: number;
    completedAt: string | null;
}

interface Monster {
    id: string;
    name: string;
    maxHealth: number;
    currentHealth: number;
    attack: number;
    rarity: string;
}

interface LogEntry {
    id: string;
    message: string;
    type: 'damage' | 'reward' | 'system' | 'danger';
    timestamp: Date;
}

export default function Home() {
    const [user, setUser] = useState<User | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [combatLog, setCombatLog] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [showShop, setShowShop] = useState(false);
    const [showQuestBoard, setShowQuestBoard] = useState(false);
    const [needsClassSelect, setNeedsClassSelect] = useState(false);

    // Track how many tasks completed since last monster retaliation
    const tasksUntilRetaliation = useRef(5);

    const addLog = (type: LogEntry['type'], message: string) => {
        setCombatLog(prev => [{
            id: Math.random().toString(36).substring(7),
            type,
            message,
            timestamp: new Date()
        }, ...prev].slice(0, 50));
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const initApp = async () => {
            try {
                let res = await fetch('/api/user?email=hero@ascendancy.local');
                if (res.status === 404) {
                    // Brand new user — show class selection first
                    setNeedsClassSelect(true);
                    setIsLoading(false);
                    return;
                }
                const userData = await res.json();
                setUser(userData);

                const tasksRes = await fetch(`/api/tasks?userId=${userData.id}`);
                const tasksData = await tasksRes.json();

                if (!Array.isArray(tasksData) || tasksData.length === 0) {
                    const headers = { 'Content-Type': 'application/json' };
                    await Promise.all([
                        fetch('/api/tasks', { method: 'POST', headers, body: JSON.stringify({ userId: userData.id, title: 'Drink Water', description: 'Stay hydrated throughout the day.', type: 'habit', difficulty: 'easy' }) }),
                        fetch('/api/tasks', { method: 'POST', headers, body: JSON.stringify({ userId: userData.id, title: 'Morning Workout', description: 'Exercise for at least 30 minutes.', type: 'daily', difficulty: 'hard' }) }),
                        fetch('/api/tasks', { method: 'POST', headers, body: JSON.stringify({ userId: userData.id, title: 'Deep Work Session', description: '2-hour focused, distraction-free block.', type: 'difficult', difficulty: 'legendary' }) }),
                        fetch('/api/tasks', { method: 'POST', headers, body: JSON.stringify({ userId: userData.id, title: 'Read for 20 mins', description: 'Expand your mind daily.', type: 'todo', difficulty: 'easy' }) }),
                    ]);
                    const newTasksRes = await fetch(`/api/tasks?userId=${userData.id}`);
                    const newTasksData = await newTasksRes.json();
                    setTasks(Array.isArray(newTasksData) ? newTasksData : []);
                } else {
                    setTasks(tasksData);
                }

                addLog('system', 'Welcome to Ascendancy. Your journey begins.');

            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        initApp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAddTask = async (taskData: { title: string; description: string; type: string; difficulty: string }) => {
        if (!user) return;
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, ...taskData })
            });
            const newTask = await res.json();
            if (res.ok) {
                setTasks(prev => [newTask, ...prev]);
                addLog('system', `New quest added: "${newTask.title}"`);
            }
        } catch (e) {
            console.error('Failed to add task:', e);
        }
    };

    const handleCompleteTask = async (taskId: string) => {
        try {
            const res = await fetch('/api/tasks/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId })
            });
            const data = await res.json();

            if (!res.ok) return;

            const prevLevel = user?.level ?? 1;

            // 1. Update user
            setUser(data.user);

            // 2. Mark task complete
            setTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, completedAt: new Date().toISOString() } : t
            ));

            // 3. Log rewards
            addLog('reward', `Gained ${data.rewards.xp} XP and ${data.rewards.gold} Gold!`);

            // 4. Level up toast
            if (data.user.level > prevLevel) {
                showToast(`⚡ LEVEL UP! You are now Level ${data.user.level}!`);
                addLog('system', `Level up! You reached Level ${data.user.level}.`);
            }

            // 5. Combat: deal damage to monster
            if (user?.activeMonster && data.combat.damageDealt > 0) {
                const dmg = data.combat.damageDealt;
                addLog('damage', `Dealt ${dmg} damage to ${user.activeMonster.name}!`);

                if (data.combat.enemyDefeated) {
                    addLog('system', `☠️ ${user.activeMonster.name} defeated! Massive loot acquired!`);
                    if (data.rewards.bonusXp) {
                        addLog('reward', `Bonus: ${data.rewards.bonusXp} XP, ${data.rewards.bonusGold} Gold!`);
                    }
                    showToast(`☠️ ${user.activeMonster.name} defeated!`);
                }
            }

            // 6. Monster retaliation every 5 completions
            tasksUntilRetaliation.current -= 1;
            if (tasksUntilRetaliation.current <= 0) {
                tasksUntilRetaliation.current = 5;
                if (user?.activeMonster) {
                    const monsterAtk = user.activeMonster.attack;
                    setUser(prevUser => {
                        if (!prevUser) return prevUser;
                        const dmgToPlayer = Math.max(1, monsterAtk - Math.floor(prevUser.level * 0.5));
                        const newHp = Math.max(0, prevUser.health - dmgToPlayer);
                        addLog('danger', `${user.activeMonster!.name} retaliates for ${dmgToPlayer} damage!`);
                        if (newHp === 0) {
                            showToast('💀 You were defeated! Penalty applied.');
                            addLog('danger', 'You have fallen. Rise again, hero...');
                        }
                        return { ...prevUser, health: newHp };
                    });
                }
            }

        } catch (e) {
            console.error('Failed to complete task:', e);
        }
    };

    const handleClassSelect = async (classId: string, username: string) => {
        try {
            const res = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email: 'hero@ascendancy.local', userClass: classId })
            });
            const userData = await res.json();
            setUser(userData);
            setNeedsClassSelect(false);

            // Seed starter tasks
            const headers = { 'Content-Type': 'application/json' };
            await Promise.all([
                fetch('/api/tasks', { method: 'POST', headers, body: JSON.stringify({ userId: userData.id, title: 'Drink Water', description: 'Stay hydrated throughout the day.', type: 'habit', difficulty: 'easy' }) }),
                fetch('/api/tasks', { method: 'POST', headers, body: JSON.stringify({ userId: userData.id, title: 'Morning Workout', description: 'Exercise for at least 30 minutes.', type: 'daily', difficulty: 'hard' }) }),
                fetch('/api/tasks', { method: 'POST', headers, body: JSON.stringify({ userId: userData.id, title: 'Deep Work Session', description: '2-hour focused, distraction-free block.', type: 'difficult', difficulty: 'legendary' }) }),
                fetch('/api/tasks', { method: 'POST', headers, body: JSON.stringify({ userId: userData.id, title: 'Read for 20 mins', description: 'Expand your mind daily.', type: 'todo', difficulty: 'easy' }) }),
            ]);
            const tasksRes = await fetch(`/api/tasks?userId=${userData.id}`);
            setTasks(await tasksRes.json());

            addLog('system', `Welcome, ${username}! Your journey begins.`);
        } catch (e) {
            console.error('Class select failed:', e);
        }
    };

    const handleSelectQuest = async (monsterId: string) => {
        if (!user) return;
        try {
            const res = await fetch('/api/quests/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, monsterId })
            });
            const updatedUser = await res.json();
            if (res.ok) {
                setUser(updatedUser);
                setShowQuestBoard(false);
                addLog('system', `Started bounty: ${updatedUser.activeMonster.name}!`);
            }
        } catch (err) {
            console.error('Failed to start quest', err);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loadingText}>Loading Realm...</div>
            </div>
        );
    }

    if (!user && needsClassSelect) {
        return <ClassSelect onSelect={handleClassSelect} />;
    }

    if (!user) return <div className={styles.errorScreen}>Failed to load hero.</div>;

    return (
        <div className="app-container">
            {/* Level-Up / Event Toast */}
            {toast && <div className={styles.toast}>{toast}</div>}

            <LeftColumn user={user} onOpenShop={() => setShowShop(true)} />
            <CenterColumn tasks={tasks} onCompleteTask={handleCompleteTask} onAddTask={handleAddTask} />
            <RightColumn
                monster={user.activeMonster ? {
                    ...user.activeMonster,
                    currentHealth: user.activeMonsterHealth ?? user.activeMonster.maxHealth
                } : null}
                combatLog={combatLog}
                onOpenQuestBoard={() => setShowQuestBoard(true)}
            />

            {/* Shop slide-in panel */}
            {showShop && (
                <ShopPanel
                    userId={user.id}
                    gold={user.gold}
                    onClose={() => setShowShop(false)}
                    onPurchase={(updatedUser) => setUser(prev => prev ? { ...prev, ...updatedUser } : prev)}
                />
            )}

            {showQuestBoard && (
                <QuestBoardModal
                    userId={user.id}
                    onClose={() => setShowQuestBoard(false)}
                    onSelectQuest={handleSelectQuest}
                />
            )}
        </div>
    );
}
