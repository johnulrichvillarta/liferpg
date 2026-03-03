'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './LeftColumn.module.css';
import PixelAvatar from '@/components/PixelAvatar/PixelAvatar';
import { calculateEquipmentBonus, EQUIPMENT_DATABASE } from '@/lib/equipment';

interface User {
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
    // Attributes (may be undefined for existing users before API update)
    strength?: number;
    intelligence?: number;
    discipline?: number;
    endurance?: number;
    luck?: number;
    charisma?: number;
    // Equipment
    equippedHead?: string | null;
    equippedBody?: string | null;
    equippedLegs?: string | null;
    equippedWeapon?: string | null;
    inventory?: string[];
}

interface LeftColumnProps {
    user: User;
    onOpenShop: () => void;
}

const CLASS_COLORS: Record<string, string> = {
    Warrior: '#facc15',
    Mage: '#818cf8',
    Rogue: '#4ade80',
    Paladin: '#c084fc',
};

export default function LeftColumn({ user, onOpenShop }: LeftColumnProps) {
    const [showStats, setShowStats] = useState(false);

    const handlePrestige = async () => {
        if (!confirm('Are you sure you want to prestige? This will wipe your character and tasks, allowing you to choose a new class.')) return;
        try {
            await fetch(`/api/user?email=${encodeURIComponent(user.email)}`, { method: 'DELETE' });
            window.location.reload();
        } catch (err) {
            console.error('Prestige failed', err);
        }
    };

    const { bonusHealth, bonusAttack } = calculateEquipmentBonus(
        user.equippedHead ?? null,
        user.equippedBody ?? null,
        user.equippedLegs ?? null,
        user.equippedWeapon ?? null
    );

    const effectiveHealth = user.health + bonusHealth;
    const effectiveMaxHealth = user.maxHealth + bonusHealth;

    const hpPercent = Math.max(0, Math.min(100, (effectiveHealth / effectiveMaxHealth) * 100));
    const mpPercent = Math.max(0, Math.min(100, (user.mana / user.maxMana) * 100));
    const xpPercent = Math.max(0, Math.min(100, (user.xp / user.xpToNextLevel) * 100));
    const classColor = CLASS_COLORS[user.class] ?? '#facc15';

    const attrs = [
        { key: 'ATK', value: (user.strength ?? 10) + bonusAttack, color: '#ef4444' }, // Added derived Attack
        { key: 'STR', value: user.strength ?? 10, color: '#f87171' },
        { key: 'INT', value: user.intelligence ?? 10, color: '#818cf8' },
        { key: 'DIS', value: user.discipline ?? 10, color: '#60a5fa' },
        { key: 'END', value: user.endurance ?? 10, color: '#4ade80' },
        { key: 'LCK', value: user.luck ?? 10, color: '#facc15' },
        { key: 'CHA', value: user.charisma ?? 10, color: '#f472b6' },
    ];

    return (
        <aside className={styles.leftColumn}>
            {/* Avatar Panel */}
            <div className={styles.avatarPanel}>
                <div className={styles.avatarWrapper}>
                    <PixelAvatar userClass={user.class} size="md" />
                </div>
                <div className={styles.userInfo}>
                    <h2 className={styles.username}>{user.username}</h2>
                    <div className={styles.badges}>
                        <span className={styles.classBadge} style={{ borderColor: classColor, color: classColor }}>
                            {user.class}
                        </span>
                        <span className={styles.levelBadge}>Lv.{user.level}</span>
                    </div>
                    <span className={styles.goldBadge}>💰 {user.gold} Gold</span>
                </div>
            </div>

            {/* Equipment Panel */}
            <div className={styles.equipmentPanel}>
                <h3 className={styles.equipmentTitle}>EQUIPMENT</h3>
                <div className={styles.equipmentGrid}>
                    {['head', 'body', 'legs', 'weapon'].map(slot => {
                        let itemId = null;
                        if (slot === 'head') itemId = user.equippedHead;
                        if (slot === 'body') itemId = user.equippedBody;
                        if (slot === 'legs') itemId = user.equippedLegs;
                        if (slot === 'weapon') itemId = user.equippedWeapon;

                        const item = itemId ? EQUIPMENT_DATABASE[itemId] : null;

                        return (
                            <div key={slot} className={styles.equipmentSlot} title={item?.name || `Empty ${slot}`}>
                                {item ? (
                                    <Image src={item.iconUrl} alt={item.name} fill className={styles.equipmentImage} sizes="40px" />
                                ) : (
                                    <span className={styles.emptySlot}>{slot}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Vitals Bars */}
            <div className={styles.statsContainer}>
                <div className={styles.statGroup}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>❤️ HP</span>
                        <span className={styles.statValue}>
                            {effectiveHealth} / {effectiveMaxHealth}
                            {bonusHealth > 0 && <span className={styles.bonusText}> (+{bonusHealth})</span>}
                        </span>
                    </div>
                    <div className={styles.barBackground}>
                        <div className={`${styles.barFill} ${styles.healthFill}`} style={{ width: `${hpPercent}%` }} />
                    </div>
                </div>

                <div className={styles.statGroup}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>💧 MP</span>
                        <span className={styles.statValue}>{user.mana} / {user.maxMana}</span>
                    </div>
                    <div className={styles.barBackground}>
                        <div className={`${styles.barFill} ${styles.manaFill}`} style={{ width: `${mpPercent}%` }} />
                    </div>
                </div>

                <div className={styles.statGroup}>
                    <div className={styles.statHeader}>
                        <span className={styles.statLabel}>⭐ XP</span>
                        <span className={styles.statValue}>{user.xp} / {user.xpToNextLevel}</span>
                    </div>
                    <div className={styles.barBackground}>
                        <div className={`${styles.barFill} ${styles.xpFill}`} style={{ width: `${xpPercent}%` }} />
                    </div>
                </div>
            </div>

            {/* Attributes Toggle */}
            <div className={styles.attributesSection}>
                <button className={styles.attrToggle} onClick={() => setShowStats(s => !s)}>
                    ATTRIBUTES {showStats ? '▲' : '▼'}
                </button>

                {showStats && (
                    <div className={styles.attrGrid}>
                        {attrs.map(a => (
                            <div key={a.key} className={styles.attrRow}>
                                <span className={styles.attrKey}>{a.key}</span>
                                <div className={styles.attrBarBg}>
                                    <div
                                        className={styles.attrBarFill}
                                        style={{ width: `${Math.min(100, a.value * 3)}%`, background: a.color }}
                                    />
                                </div>
                                <span className={styles.attrVal} style={{ color: a.color }}>{a.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className={styles.navLinks}>
                <button className={styles.shopLink} onClick={onOpenShop}>
                    ⚒️ SHOP
                </button>
                <button className={styles.prestigeLink} onClick={handlePrestige}>
                    ✨ PRESTIGE
                </button>
            </div>
        </aside>
    );
}
