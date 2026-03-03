'use client';

import React from 'react';
import styles from './RightColumn.module.css';

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

interface RightColumnProps {
    monster: Monster | null;
    combatLog: LogEntry[];
    onOpenQuestBoard: () => void;
}

const RARITY_COLORS: Record<string, string> = {
    common: '#9ca3af',
    rare: '#60a5fa',
    epic: '#c084fc',
    legendary: '#facc15',
};

const LOG_ICONS: Record<string, string> = {
    damage: '⚔️',
    reward: '✨',
    system: '📜',
    danger: '💀',
};

const getMonsterIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('slime')) return '🦠';
    if (lowerName.includes('goblin')) return '👺';
    if (lowerName.includes('wolf')) return '🐺';
    if (lowerName.includes('spider')) return '🕷️';
    if (lowerName.includes('golem')) return '🪨';
    if (lowerName.includes('wraith')) return '👻';
    if (lowerName.includes('hydra')) return '🐍';
    if (lowerName.includes('demon')) return '👿';
    if (lowerName.includes('dragon')) return '🐉';
    if (lowerName.includes('titan')) return '🗿';
    return '👾';
};


export default function RightColumn({ monster, combatLog, onOpenQuestBoard }: RightColumnProps) {

    const renderMonster = () => {
        if (!monster) {
            return (
                <div className={styles.noMonsterState}>
                    <div className={styles.noMonsterIcon}>🌙</div>
                    <p>The realm is quiet...</p>
                    <p className={styles.noMonsterSub}>Bounties are posted on the board.</p>
                    <button className={styles.questBoardBtn} onClick={onOpenQuestBoard}>
                        📜 VIEW QUEST BOARD
                    </button>
                </div>
            );
        }

        const hpPercent = Math.max(0, Math.min(100, (monster.currentHealth / monster.maxHealth) * 100));
        const rarityColor = RARITY_COLORS[monster.rarity] ?? '#9ca3af';
        const isDefeated = monster.currentHealth === 0;
        const isDangerous = hpPercent < 25;

        return (
            <div className={styles.monsterPanel}>
                {/* DALL-E Asset Area */}
                <div
                    className={`${styles.spriteArea} ${isDefeated ? styles.defeated : ''}`}
                    style={{ '--rarity-color': rarityColor } as React.CSSProperties}
                >
                    <div className={styles.rarityGlow} />
                    <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 2 }}>
                        <img
                            src={`/monsters/${monster.name.toLowerCase()}.png`}
                            alt={monster.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                imageRendering: 'pixelated',
                                filter: isDefeated ? 'grayscale(1) brightness(0.5)' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onError={(e) => { e.currentTarget.src = '/monsters/placeholder.png'; }}
                        />
                    </div>
                    {isDefeated && <div className={styles.defeatedBanner} style={{ zIndex: 10 }}>DEFEATED</div>}
                </div>

                {/* Name + rarity */}
                <div className={styles.monsterMeta}>
                    <h3 className={styles.monsterName}>{monster.name}</h3>
                    <span className={styles.rarityBadge} style={{ color: rarityColor, borderColor: rarityColor + '55' }}>
                        {monster.rarity.toUpperCase()}
                    </span>
                </div>

                {/* HP Bar */}
                <div className={styles.hpSection}>
                    <div className={styles.hpHeader}>
                        <span className={styles.hpLabel}>❤️ HEALTH</span>
                        <span className={styles.hpValue}>{monster.currentHealth} / {monster.maxHealth}</span>
                    </div>
                    <div className={styles.hpBarBg}>
                        <div
                            className={`${styles.hpBar} ${isDangerous ? styles.hpDanger : ''}`}
                            style={{
                                width: `${hpPercent}%`,
                                background: isDangerous
                                    ? 'linear-gradient(90deg, #dc2626, #f87171)'
                                    : `linear-gradient(90deg, ${rarityColor}99, ${rarityColor})`,
                            }}
                        />
                    </div>
                    <div className={styles.hpTicks}>
                        {[25, 50, 75].map(t => (
                            <div key={t} className={styles.hpTick} style={{ left: `${t}%` }} />
                        ))}
                    </div>
                </div>

                {/* Attack stat */}
                <div className={styles.monsterStats}>
                    <span className={styles.monsterStat}>⚡ ATK {monster.attack}</span>
                    <span className={styles.monsterStat}>
                        {hpPercent > 50 ? '😡 Angry' : hpPercent > 0 ? '😤 Wounded' : '💀 Slain'}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <aside className={styles.rightColumn}>
            {/* Monster section */}
            <section className={styles.combatSection}>
                <h2 className={styles.sectionTitle}>⚔ CURRENT TARGET</h2>
                {renderMonster()}
            </section>

            {/* Adventure Log */}
            <section className={styles.logSection}>
                <h2 className={styles.sectionTitle}>📜 ADVENTURE LOG</h2>
                <div className={styles.logWindow}>
                    {combatLog.length === 0 ? (
                        <div className={styles.emptyLog}>It is quiet... too quiet.</div>
                    ) : (
                        combatLog.map(log => (
                            <div key={log.id} className={`${styles.logEntry} ${styles[log.type]}`}>
                                <span className={styles.logIcon}>{LOG_ICONS[log.type]}</span>
                                <span className={styles.logMessage}>{log.message}</span>
                                <span className={styles.logTime}>
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </aside>
    );
}
