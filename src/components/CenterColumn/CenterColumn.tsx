'use client';

import React, { useState } from 'react';
import styles from './CenterColumn.module.css';
import AddTaskModal from './AddTaskModal';

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

interface CenterColumnProps {
    tasks: Task[];
    onCompleteTask: (taskId: string) => void;
    onAddTask: (task: { title: string; description: string; type: string; difficulty: string }) => void;
}

export default function CenterColumn({ tasks, onCompleteTask, onAddTask }: CenterColumnProps) {
    const [activeTab, setActiveTab] = useState<'habit' | 'daily' | 'todo' | 'difficult'>('habit');
    const [showModal, setShowModal] = useState(false);

    const incompletedTasks = (Array.isArray(tasks) ? tasks : []).filter(t => !t.completedAt);
    const displayedTasks = incompletedTasks.filter(t => t.type === activeTab);

    const getDifficultyColorClass = (diff: string) => {
        switch (diff) {
            case 'easy': return styles.diffEasy;
            case 'medium': return styles.diffMedium;
            case 'hard': return styles.diffHard;
            case 'legendary': return styles.diffLegendary;
            default: return '';
        }
    };

    return (
        <main className={styles.centerColumn}>
            {/* Tab Navigation */}
            <nav className={styles.tabNav}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'habit' ? styles.active : ''}`}
                    onClick={() => setActiveTab('habit')}
                >
                    HABITS
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'daily' ? styles.active : ''}`}
                    onClick={() => setActiveTab('daily')}
                >
                    DAILIES
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'todo' ? styles.active : ''}`}
                    onClick={() => setActiveTab('todo')}
                >
                    TO-DOS
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'difficult' ? styles.active : ''} ${styles.difficultTab}`}
                    onClick={() => setActiveTab('difficult')}
                >
                    EPIC
                </button>
            </nav>

            {/* Task List */}
            <div className={styles.taskList}>
                {displayedTasks.length === 0 ? (
                    <div className={styles.emptyState}>No quests here... yet.</div>
                ) : (
                    displayedTasks.map(task => (
                        <div
                            key={task.id}
                            className={`${styles.taskCard} ${getDifficultyColorClass(task.difficulty)}`}
                        >
                            <div className={styles.taskContent}>
                                <h3 className={styles.taskTitle}>{task.title}</h3>
                                {task.description && <p className={styles.taskDesc}>{task.description}</p>}
                                <div className={styles.taskRewards}>
                                    {task.streak > 0 && (
                                        <span className={`${styles.streakTag} ${task.streak > 3 ? styles.hotStreak : ''}`}>
                                            🔥 {task.streak}
                                        </span>
                                    )}
                                    <span className={styles.rewardTag}>⭐ {task.xpReward} XP</span>
                                    <span className={styles.rewardTag}>💰 {task.goldReward} Gold</span>
                                    {task.manaReward > 0 && <span className={styles.rewardTag}>💧 {task.manaReward} MP</span>}
                                </div>
                            </div>
                            <button
                                className={styles.completeBtn}
                                onClick={() => onCompleteTask(task.id)}
                            >
                                <span className={styles.swordIcon}>⚔️</span>
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add Task Button */}
            <button className={styles.addTaskBtn} onClick={() => setShowModal(true)}>
                + ADD QUEST
            </button>

            {/* Add Task Modal */}
            {showModal && (
                <AddTaskModal
                    defaultType={activeTab === 'difficult' ? 'difficult' : activeTab}
                    onClose={() => setShowModal(false)}
                    onSave={onAddTask}
                />
            )}
        </main>
    );
}
