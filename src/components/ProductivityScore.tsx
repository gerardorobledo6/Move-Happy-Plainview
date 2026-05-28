import React, { useMemo } from 'react';
import { Card } from '../types';
import styles from './ProductivityScore.module.css';
import { Target, TrendingUp } from 'lucide-react';

interface Props {
    cards: Card[];
    userId: string;
}

const ProductivityScore: React.FC<Props> = ({ cards, userId }) => {
    const today = new Date().toISOString().split('T')[0];

    const stats = useMemo(() => {
        const userCards = cards.filter(c => c.assignedUsers.some(u => u.id === userId));
        
        const completedToday = userCards.filter(c => {
            if (!c.resolvedAt) return false;
            return c.resolvedAt.split('T')[0] === today;
        });

        const efficiency = userCards.length > 0 
            ? Math.round((completedToday.length / (completedToday.length + userCards.filter(c => !c.resolvedAt).length)) * 100) 
            : 0;

        return {
            completed: completedToday.length,
            efficiency
        };
    }, [cards, userId, today]);

    if (stats.completed === 0 && stats.efficiency === 0) return null;

    return (
        <div className={styles.container}>
            <div className={styles.stat} title="Completed Today">
                <Target size={14} className={styles.icon} />
                <span className={styles.label}>Today:</span>
                <span className={styles.value}>{stats.completed}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.stat} title="Efficiency Score">
                <TrendingUp size={14} className={styles.icon} />
                <span className={styles.value}>{stats.efficiency}%</span>
            </div>
        </div>
    );
};

export default ProductivityScore;
