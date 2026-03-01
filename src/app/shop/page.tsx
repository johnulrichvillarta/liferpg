'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './shop.module.css';

interface ShopItem {
    id: string;
    name: string;
    category: string;
    description: string;
    cost: number;
    icon: string;
    effect: Record<string, number>;
}

interface User {
    id: string;
    username: string;
    gold: number;
    health: number;
    maxHealth: number;
    mana: number;
    maxMana: number;
    level: number;
}

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'consumable', label: '🧪 Consumables' },
    { id: 'weapon', label: '⚔️ Weapons' },
    { id: 'armour', label: '🛡️ Armour' },
    { id: 'cosmetic', label: '✨ Cosmetics' },
];

export default function ShopPage() {
    const [user, setUser] = useState<User | null>(null);
    const [items, setItems] = useState<ShopItem[]>([]);
    const [category, setCategory] = useState('all');
    const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
    const [buying, setBuying] = useState<string | null>(null);

    const showToast = (msg: string, error = false) => {
        setToast({ msg, error });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const init = async () => {
            const [userRes, shopRes] = await Promise.all([
                fetch('/api/user?email=hero@ascendancy.local'),
                fetch('/api/shop')
            ]);
            if (userRes.ok) setUser(await userRes.json());
            if (shopRes.ok) setItems(await shopRes.json());
        };
        init();
    }, []);

    const handleBuy = async (item: ShopItem) => {
        if (!user || buying) return;
        setBuying(item.id);
        try {
            const res = await fetch('/api/shop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, itemId: item.id })
            });
            const data = await res.json();
            if (res.ok) {
                setUser(data.user);
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

    const displayedItems = category === 'all' ? items : items.filter(i => i.category === category);

    return (
        <div className={styles.page}>
            {/* Toast */}
            {toast && (
                <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/" className={styles.backBtn}>← Back to Realm</Link>
                    <h1 className={styles.shopTitle}>⚒️ THE MERCHANT</h1>
                </div>
                <div className={styles.goldDisplay}>
                    💰 {user?.gold ?? '—'} Gold
                </div>
            </header>

            {/* Category Tabs */}
            <nav className={styles.categoryNav}>
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

            {/* Item Grid */}
            <div className={styles.itemGrid}>
                {displayedItems.map(item => {
                    const canAfford = (user?.gold ?? 0) >= item.cost;
                    return (
                        <div
                            key={item.id}
                            className={`${styles.itemCard} ${!canAfford ? styles.cantAfford : ''}`}
                        >
                            <div className={styles.itemIcon}>{item.icon}</div>
                            <div className={styles.itemBody}>
                                <h3 className={styles.itemName}>{item.name}</h3>
                                <p className={styles.itemDesc}>{item.description}</p>
                                <span className={`${styles.categoryBadge} ${styles[item.category + 'Badge']}`}>
                                    {item.category}
                                </span>
                            </div>
                            <div className={styles.itemFooter}>
                                <span className={styles.itemCost}>💰 {item.cost}</span>
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
    );
}
