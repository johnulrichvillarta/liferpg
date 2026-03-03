'use client';

import React, { useEffect, useState } from 'react';
import styles from './QuestBoardModal.module.css';

interface Monster {
    id: string;
    name: string;
    rarity: string;
    maxHealth: number;
    attack: number;
    lore: string;
    minLevel: number;
    locked: boolean;
}

interface QuestBoardModalProps {
    userId: string;
    onClose: () => void;
    onSelectQuest: (monsterId: string) => void;
}

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

const RARITY_COLORS: Record<string, string> = {
    common: '#6ee7b7',
    rare: '#60a5fa',
    epic: '#c084fc',
    legendary: '#facc15',
};

export default function QuestBoardModal({ userId, onClose, onSelectQuest }: QuestBoardModalProps) {
    const [monsters, setMonsters] = useState<Monster[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuests = async () => {
            try {
                const res = await fetch(`/api/quests?userId=${userId}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setMonsters(data);
                } else {
                    console.error('Unexpected quests response:', data);
                }
            } catch (err) {
                console.error('Failed to load quests', err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuests();
    }, [userId]);

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>
                <div className={styles.header}>
                    <h2 className={styles.title}>📜 QUEST BOARD</h2>
                    <p className={styles.subtitle}>Select a bounty to pursue. Higher rarity means tougher fights but greater rewards.</p>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loading}>Scouting the realm...</div>
                    ) : (
                        <div className={styles.grid}>
                            {monsters.map(monster => {
                                const rColor = RARITY_COLORS[monster.rarity] || '#999';
                                const isLocked = monster.locked;
                                return (
                                    <div
                                        key={monster.id}
                                        className={`${styles.card} ${isLocked ? styles.cardLocked : ''}`}
                                        style={{ '--card-color': isLocked ? '#555' : rColor } as React.CSSProperties}
                                    >
                                        <div className={styles.cardHeader} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: 48, height: 48, flexShrink: 0, position: 'relative', borderRadius: '4px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                                                <img
                                                    src={isLocked ? '/monsters/placeholder.png' : `/monsters/${monster.name.toLowerCase()}.png`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', opacity: isLocked ? 0.3 : 1 }}
                                                    onError={(e) => { e.currentTarget.src = '/monsters/placeholder.png'; }}
                                                    alt={isLocked ? 'Locked Monster' : monster.name}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 className={styles.monsterName} style={{ marginBottom: 4 }}>
                                                    {isLocked ? '❓ ??? (Locked)' : monster.name}
                                                </h3>
                                                {!isLocked && (
                                                    <span className={styles.rarityBadge} style={{ color: rColor, borderColor: rColor }}>
                                                        {monster.rarity.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.monsterLore}>
                                            {isLocked ? `A dangerous foe that resides beyond your current understanding. Reach Level ${monster.minLevel} to pursue this bounty.` : `"${monster.lore}"`}
                                        </div>

                                        {!isLocked && (
                                            <div className={styles.stats}>
                                                <span className={styles.statTag}>❤️ {monster.maxHealth} HP</span>
                                                <span className={styles.statTag}>⚔️ {monster.attack} ATK</span>
                                            </div>
                                        )}

                                        <button
                                            className={styles.acceptBtn}
                                            style={isLocked ? {} : { backgroundColor: `${rColor}22`, color: rColor, borderColor: rColor }}
                                            onClick={() => !isLocked && onSelectQuest(monster.id)}
                                            disabled={isLocked}
                                        >
                                            {isLocked ? `REQUIRES LV.${monster.minLevel}` : 'ACCEPT BOUNTY'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
