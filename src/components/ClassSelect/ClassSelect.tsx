'use client';

import React, { useState } from 'react';
import styles from './ClassSelect.module.css';

interface ClassDef {
    id: string;
    name: string;
    icon: string;
    description: string;
    passive: string;
    stats: { label: string; value: number }[];
    color: string;
}

const CLASSES: ClassDef[] = [
    {
        id: 'Warrior',
        name: 'Warrior',
        icon: '⚔️',
        description: 'A battle-hardened fighter who grows stronger with every difficult challenge overcome.',
        passive: '+10% Gold from Hard & Legendary tasks',
        color: '#facc15',
        stats: [
            { label: 'Strength', value: 90 },
            { label: 'Endurance', value: 75 },
            { label: 'Intelligence', value: 30 },
            { label: 'Luck', value: 40 },
        ]
    },
    {
        id: 'Mage',
        name: 'Mage',
        icon: '🪄',
        description: 'A scholar of arcane arts. Task streaks restore Mana which fuels devastating spells.',
        passive: '3 tasks in a row restores Mana',
        color: '#60a5fa',
        stats: [
            { label: 'Intelligence', value: 90 },
            { label: 'Discipline', value: 75 },
            { label: 'Strength', value: 25 },
            { label: 'Endurance', value: 35 },
        ]
    },
    {
        id: 'Rogue',
        name: 'Rogue',
        icon: '🗡️',
        description: 'A cunning opportunist. High critical strike chance and bonus loot from every encounter.',
        passive: 'Random bonus loot chance on task completion',
        color: '#4ade80',
        stats: [
            { label: 'Luck', value: 90 },
            { label: 'Charisma', value: 80 },
            { label: 'Strength', value: 50 },
            { label: 'Endurance', value: 30 },
        ]
    },
    {
        id: 'Paladin',
        name: 'Paladin',
        icon: '🛡️',
        description: 'A holy protector. Balanced between offense and defense — missed dailies cost half health.',
        passive: 'Missed Daily penalty reduced by 50%',
        color: '#c084fc',
        stats: [
            { label: 'Endurance', value: 85 },
            { label: 'Strength', value: 70 },
            { label: 'Intelligence', value: 60 },
            { label: 'Luck', value: 45 },
        ]
    },
];

interface ClassSelectProps {
    onSelect: (classId: string, username: string) => void;
}

export default function ClassSelect({ onSelect }: ClassSelectProps) {
    const [hovered, setHovered] = useState<string | null>(null);
    const [username, setUsername] = useState('');
    const active = CLASSES.find(c => c.id === hovered) ?? CLASSES[0];

    return (
        <div className={styles.screen}>
            <div className={styles.bg} />

            <div className={styles.content}>
                <h1 className={styles.title}>CHOOSE YOUR CLASS</h1>
                <p className={styles.subtitle}>Your class defines your playstyle. Choose wisely — this cannot be changed.</p>

                {/* Username input */}
                <div className={styles.usernameRow}>
                    <label className={styles.usernameLabel}>HERO NAME</label>
                    <input
                        className={styles.usernameInput}
                        type="text"
                        placeholder="Enter your name..."
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        maxLength={20}
                        autoFocus
                    />
                </div>

                <div className={styles.layout}>
                    {/* Class Cards */}
                    <div className={styles.classGrid}>
                        {CLASSES.map(cls => (
                            <div
                                key={cls.id}
                                className={`${styles.classCard} ${hovered === cls.id ? styles.selected : ''}`}
                                style={hovered === cls.id ? { borderColor: cls.color, boxShadow: `0 0 20px ${cls.color}44` } : {}}
                                onMouseEnter={() => setHovered(cls.id)}
                                onClick={() => onSelect(cls.id, username.trim() || 'Hero')}
                            >
                                <div className={styles.classIcon} style={hovered === cls.id ? { color: cls.color } : {}}>
                                    {cls.icon}
                                </div>
                                <div className={styles.className}>{cls.name}</div>
                            </div>
                        ))}
                    </div>

                    {/* Detail Panel */}
                    <div className={styles.detailPanel} style={{ borderColor: active.color + '55' }}>
                        <div className={styles.detailIcon}>{active.icon}</div>
                        <h2 className={styles.detailName} style={{ color: active.color }}>{active.name}</h2>
                        <p className={styles.detailDesc}>{active.description}</p>
                        <div className={styles.passive}>
                            <span className={styles.passiveLabel}>PASSIVE</span>
                            <span className={styles.passiveText}>{active.passive}</span>
                        </div>
                        <div className={styles.statBars}>
                            {active.stats.map(s => (
                                <div key={s.label} className={styles.statRow}>
                                    <span className={styles.statLabel}>{s.label}</span>
                                    <div className={styles.statBarBg}>
                                        <div
                                            className={styles.statBarFill}
                                            style={{ width: `${s.value}%`, background: active.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            className={styles.selectBtn}
                            style={{ background: active.color }}
                            onClick={() => onSelect(active.id, username.trim() || 'Hero')}
                        >
                            BEGIN AS {active.name.toUpperCase()} →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
