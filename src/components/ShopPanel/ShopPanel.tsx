'use client';

import React, { useState, useEffect } from 'react';
import styles from './ShopPanel.module.css';

interface ShopItem {
    id: string;
    name: string;
    category: string;
    description: string;
    cost: number;
    icon: string;
    effect: Record<string, number>;
}

interface CustomReward {
    id: string;
    userId: string;
    title: string;
    cost: number;
    icon: string;
}

interface ShopPanelProps {
    userId: string;
    gold: number;
    onClose: () => void;
    onPurchase: (updatedUser: Record<string, number>) => void;
}

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'custom', label: '🌟 Real Life' },
    { id: 'consumable', label: '🧪 Consum.' },
    { id: 'weapon', label: '⚔️ Weapons' },
    { id: 'armour', label: '🛡️ Armour' },
    { id: 'cosmetic', label: '✨ Cosmetic' },
];

export default function ShopPanel({ userId, gold, onClose, onPurchase }: ShopPanelProps) {
    const [items, setItems] = useState<ShopItem[]>([]);
    const [category, setCategory] = useState('all');
    const [customRewards, setCustomRewards] = useState<CustomReward[]>([]);
    const [buying, setBuying] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
    const [currentGold, setCurrentGold] = useState(gold);

    // Form state for creating a new custom reward
    const [newTitle, setNewTitle] = useState('');
    const [newCost, setNewCost] = useState('50');
    const [newIcon, setNewIcon] = useState('🎁');

    const showToast = (msg: string, error = false) => {
        setToast({ msg, error });
        setTimeout(() => setToast(null), 2500);
    };

    useEffect(() => {
        fetch('/api/shop').then(r => r.json()).then(setItems);
        fetchCustomRewards();
    }, []);

    const fetchCustomRewards = async () => {
        try {
            const res = await fetch(`/api/custom-rewards?userId=${userId}`);
            setCustomRewards(await res.json());
        } catch (e) {
            console.error('Failed to load custom rewards', e);
        }
    };

    useEffect(() => {
        setCurrentGold(gold);
    }, [gold]);

    const handleBuy = async (item: ShopItem) => {
        if (buying) return;
        setBuying(item.id);
        try {
            const res = await fetch('/api/shop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, itemId: item.id })
            });
            const data = await res.json();
            if (res.ok) {
                setCurrentGold(data.user.gold);
                onPurchase(data.user);
                showToast(`✅ ${item.name} purchased!`);
            } else {
                showToast(data.error || 'Purchase failed.', true);
            }
        } catch {
            showToast('Network error.', true);
        } finally {
            setBuying(null);
        }
    };

    const handleBuyCustom = async (reward: CustomReward) => {
        if (buying) return;
        setBuying(reward.id);
        try {
            const res = await fetch('/api/custom-rewards/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, rewardId: reward.id })
            });
            const data = await res.json();
            if (res.ok) {
                setCurrentGold(data.user.gold);
                onPurchase(data.user);
                showToast(`✅ Enjoy your real life reward: ${reward.title}!`);
            } else {
                showToast(data.error || 'Purchase failed.', true);
            }
        } catch {
            showToast('Network error.', true);
        } finally {
            setBuying(null);
        }
    };

    const handleCreateCustom = async () => {
        if (!newTitle.trim()) return;
        try {
            const res = await fetch('/api/custom-rewards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, title: newTitle, cost: parseInt(newCost) || 50, icon: newIcon })
            });
            if (res.ok) {
                setNewTitle('');
                setNewCost('50');
                fetchCustomRewards();
                showToast('Custom reward created!');
            }
        } catch (e) {
            console.error(e);
            showToast('Failed to create reward', true);
        }
    };

    const handleDeleteCustom = async (id: string) => {
        try {
            await fetch(`/api/custom-rewards?id=${id}`, { method: 'DELETE' });
            fetchCustomRewards();
            showToast('Reward deleted.');
        } catch (e) {
            console.error(e);
        }
    };

    const displayed = category === 'all' ? items : items.filter(i => i.category === category);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>⚒️ THE MERCHANT</h2>
                        <span className={styles.gold}>💰 {currentGold} Gold</span>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>
                        {toast.msg}
                    </div>
                )}

                {/* Category Nav */}
                <nav className={styles.catNav}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`${styles.catBtn} ${category === cat.id ? styles.catActive : ''}`}
                            onClick={() => setCategory(cat.id)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </nav>

                {/* Items */}
                <div className={styles.itemList}>
                    {category === 'custom' && (
                        <div className={styles.customRewardZone}>
                            <div className={styles.customAddForm}>
                                <input className={styles.customIconInput} value={newIcon} onChange={e => setNewIcon(e.target.value)} maxLength={2} placeholder="🎁" title="Icon / Emoji" />
                                <input className={styles.customTitleInput} value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="E.g. 1 Hr Video Games" />
                                <input className={styles.customCostInput} type="number" value={newCost} onChange={e => setNewCost(e.target.value)} placeholder="Cost" min="1" />
                                <button className={styles.customAddBtn} onClick={handleCreateCustom}>ADD</button>
                            </div>
                            {customRewards.length === 0 && <div className={styles.emptyCustom}>No custom rewards yet. Create one to reward yourself in real life!</div>}
                            {customRewards.map(reward => {
                                const canAfford = currentGold >= reward.cost;
                                return (
                                    <div key={reward.id} className={`${styles.itemCard} ${!canAfford ? styles.dimmed : ''}`}>
                                        <div className={styles.itemIcon}>{reward.icon}</div>
                                        <div className={styles.itemBody}>
                                            <div className={styles.itemName}>{reward.title}</div>
                                            <div className={styles.itemDesc}>Real Life Reward</div>
                                        </div>
                                        <div className={styles.itemRight}>
                                            <span className={styles.cost}>💰 {reward.cost}</span>
                                            <button
                                                className={styles.buyBtn}
                                                disabled={!canAfford || buying === reward.id}
                                                onClick={() => handleBuyCustom(reward)}
                                            >
                                                {buying === reward.id ? '...' : 'BUY'}
                                            </button>
                                            <button className={styles.deleteBtn} onClick={() => handleDeleteCustom(reward.id)}>🗑️</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {category !== 'custom' && displayed.map(item => {
                        const canAfford = currentGold >= item.cost;
                        return (
                            <div key={item.id} className={`${styles.itemCard} ${!canAfford ? styles.dimmed : ''}`}>
                                <div className={styles.itemIcon}>{item.icon}</div>
                                <div className={styles.itemBody}>
                                    <div className={styles.itemName}>{item.name}</div>
                                    <div className={styles.itemDesc}>{item.description}</div>
                                </div>
                                <div className={styles.itemRight}>
                                    <span className={styles.cost}>💰 {item.cost}</span>
                                    <button
                                        className={styles.buyBtn}
                                        disabled={!canAfford || buying === item.id}
                                        onClick={() => handleBuy(item)}
                                    >
                                        {buying === item.id ? '...' : 'BUY'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
