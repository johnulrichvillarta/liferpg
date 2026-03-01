'use client';

import React, { useState } from 'react';
import styles from './AddTaskModal.module.css';

interface AddTaskModalProps {
    defaultType?: 'habit' | 'daily' | 'todo' | 'difficult';
    onClose: () => void;
    onSave: (task: { title: string; description: string; type: string; difficulty: string }) => void;
}

const TASK_TYPES = [
    { value: 'habit' as const, label: 'Habit', color: '#4ade80' },
    { value: 'daily' as const, label: 'Daily', color: '#60a5fa' },
    { value: 'todo' as const, label: 'To-Do', color: '#facc15' },
    { value: 'difficult' as const, label: 'Epic Task', color: '#c084fc' },
];

const DIFFICULTIES = [
    { value: 'easy', label: 'Easy', xp: 5 },
    { value: 'medium', label: 'Medium', xp: 10 },
    { value: 'hard', label: 'Hard', xp: 20 },
    { value: 'legendary', label: 'Legendary', xp: 50 },
];

export default function AddTaskModal({ defaultType = 'habit', onClose, onSave }: AddTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'habit' | 'daily' | 'todo' | 'difficult'>(defaultType);
    const [difficulty, setDifficulty] = useState<string>('medium');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSave({ title: title.trim(), description: description.trim(), type, difficulty });
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Add New Quest</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Title */}
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>TASK TITLE</label>
                        <input
                            autoFocus
                            className={styles.input}
                            type="text"
                            placeholder="What must be done?"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            maxLength={80}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>DESCRIPTION (optional)</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Add more details..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* Type selector */}
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>TYPE</label>
                        <div className={styles.chipRow}>
                            {TASK_TYPES.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    className={`${styles.chip} ${type === t.value ? styles.chipActive : ''}`}
                                    style={type === t.value ? { borderColor: t.color, color: t.color } : {}}
                                    onClick={() => setType(t.value)}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty selector */}
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>DIFFICULTY</label>
                        <div className={styles.chipRow}>
                            {DIFFICULTIES.map(d => (
                                <button
                                    key={d.value}
                                    type="button"
                                    className={`${styles.chip} ${difficulty === d.value ? styles.chipActive : ''}`}
                                    onClick={() => setDifficulty(d.value)}
                                >
                                    {d.label}
                                    <span className={styles.chipXp}>+{d.xp} XP</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                        <button type="submit" className={styles.saveBtn} disabled={!title.trim()}>
                            ⚔️ Add Quest
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
