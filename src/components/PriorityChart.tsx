import React, { useMemo } from 'react';
import styles from './PriorityChart.module.css';
import { Lane } from '../types';

interface Props {
    lanes: Lane[];
}

const PriorityChart: React.FC<Props> = ({ lanes }) => {
    const stats = useMemo(() => {
        const counts = {
            Normal: 0,
            High: 0,
            Urgent: 0
        };

        lanes.forEach(lane => {
            lane.cards.forEach(card => {
                if (card.priority in counts) {
                    counts[card.priority as keyof typeof counts]++;
                }
            });
        });

        const maxCount = Math.max(...Object.values(counts), 1);
        
        return {
            items: [
                { name: 'Normal', count: counts.Normal, colorClass: styles.normal },
                { name: 'High', count: counts.High, colorClass: styles.high },
                { name: 'Urgent', count: counts.Urgent, colorClass: styles.urgent }
            ],
            maxCount
        };
    }, [lanes]);

    return (
        <div className={styles.container}>
            <h4 className={styles.title}>Priority Distribution</h4>
            <div className={styles.chartArea}>
                {stats.items.map((item) => (
                    <div key={item.name} className={styles.barRow}>
                        <div className={styles.labelInfo}>
                            <span className={styles.priorityName}>{item.name}</span>
                            <span className={styles.count}>{item.count}</span>
                        </div>
                        <div className={styles.barTrack}>
                            <div 
                                className={`${styles.barFill} ${item.colorClass}`}
                                style={{ width: `${(item.count / stats.maxCount) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PriorityChart;
