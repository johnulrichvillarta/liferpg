'use client';

import React, { useEffect, useRef } from 'react';
import { drawMonster, MonsterBlueprint } from '@/lib/monsterEngine';
import styles from './MonsterCanvas.module.css';

interface MonsterCanvasProps {
    monster: MonsterBlueprint;
    width?: number;
    height?: number;
    isDefeated?: boolean;
}

export default function MonsterCanvas({ monster, width = 200, height = 160, isDefeated = false }: MonsterCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        drawMonster(ctx, monster, width, height);
    }, [monster.id, monster.name, monster.rarity, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={`${styles.canvas} ${isDefeated ? styles.defeated : ''}`}
            title={monster.name}
        />
    );
}
