import React, { useMemo } from 'react';
import { User, Card, Lane } from '../types';
import styles from './SmartStartModal.module.css';
import { CheckCircle2, ArrowRight, Sun, Sparkles, Clock } from 'lucide-react';

interface Props {
    user: User;
    lanes: Lane[];
    onClose: () => void;
    onStartDay: () => void;
}

const SmartStartModal: React.FC<Props> = ({ user, lanes, onClose, onStartDay }) => {
    const stats = useMemo(() => {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const allCards = lanes.flatMap(l => l.cards);
        const userCards = allCards.filter(c => c.assignedUsers.some(u => u.id === user.id));
        
        const resolvedYesterday = userCards.filter(c => {
            if (!c.resolvedAt) return false;
            return c.resolvedAt.split('T')[0] === yesterdayStr;
        });

        const pendingTasks = userCards.filter(c => !c.resolvedAt);

        return {
            resolvedCount: resolvedYesterday.length,
            pendingTasks: pendingTasks.slice(0, 3), // Show top 3
            totalPending: pendingTasks.length
        };
    }, [lanes, user]);

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.welcome}>
                        <Sun className={styles.sunIcon} />
                        <h2>Good morning, {user.name.split(' ')[0]} 👋</h2>
                    </div>
                    <p>Let's get your day started with some AI-powered insights.</p>
                </div>

                <div className={styles.summarySection}>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryIcon}>
                            <CheckCircle2 size={20} />
                        </div>
                        <div className={styles.summaryText}>
                            <strong>{stats.resolvedCount} tasks</strong> resolved yesterday. Great momentum!
                        </div>
                    </div>
                </div>

                <div className={styles.pendingSection}>
                    <h3>
                        <Clock size={16} /> 
                        Unfinished from yesterday ({stats.totalPending})
                    </h3>
                    <div className={styles.taskList}>
                        {stats.pendingTasks.map(task => (
                            <div key={task.id} className={styles.taskItem}>
                                <div className={styles.taskInfo}>
                                    <span className={styles.taskTitle}>{task.title}</span>
                                    <span className={styles.taskMeta}>#{task.orderNumber || task.headerId}</span>
                                </div>
                                <div className={`${styles.priorityBadge} ${styles[task.priority.toLowerCase()]}`}>
                                    {task.priority}
                                </div>
                            </div>
                        ))}
                        {stats.totalPending > 3 && (
                            <div className={styles.moreTasks}>
                                + {stats.totalPending - 3} more pending tasks
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.aiInsight}>
                    <Sparkles size={16} className={styles.aiIcon} />
                    <p>AI suggests starting with <strong>{stats.pendingTasks[0]?.title || 'your backlog'}</strong> to maintain workflow continuity.</p>
                </div>

                <div className={styles.actions}>
                    <button onClick={onClose} className="btn btn-outline">Review Later</button>
                    <button onClick={onStartDay} className="btn btn-primary">
                        Start My Day <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SmartStartModal;
