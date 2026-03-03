'use client';

import React from 'react';
import Image from 'next/image';
import styles from './PixelAvatar.module.css';

interface PixelAvatarProps {
    userClass: string;
    size?: 'sm' | 'md' | 'lg';
}

const CLASS_PALETTES: Record<string, { primary: string; secondary: string; accent: string }> = {
    Warrior: { primary: '#facc15', secondary: '#7c6109', accent: '#ff6b35' },
    Mage: { primary: '#818cf8', secondary: '#1e1b4b', accent: '#a5f3fc' },
    Rogue: { primary: '#4ade80', secondary: '#14532d', accent: '#86efac' },
    Paladin: { primary: '#c084fc', secondary: '#4a1d96', accent: '#fde68a' },
};

export default function PixelAvatar({ userClass, size = 'md' }: PixelAvatarProps) {
    const palette = CLASS_PALETTES[userClass] ?? CLASS_PALETTES['Warrior'];
    const imagePath = `/classes/${userClass.toLowerCase()}.png`;

    return (
        <div className={`${styles.avatarWrap} ${styles[size]}`}>
            <div className={styles.avatar} style={{ '--primary': palette.primary } as React.CSSProperties}>
                {/* Glow ring based on class primary color */}
                <div className={styles.glowRing} />

                {/* The actual generated Next/Image */}
                <div className={styles.imageContainer}>
                    <Image
                        src={imagePath}
                        alt={`${userClass} Avatar`}
                        fill
                        className={styles.pixelImage}
                        sizes="160px"
                    />
                </div>
            </div>
        </div>
    );
}
