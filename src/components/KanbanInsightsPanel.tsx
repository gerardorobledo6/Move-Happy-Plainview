import React, { useState } from 'react';
import { useKanbanIntelligence } from '../utils/useKanbanIntelligence';
import { Lane } from '../types';
import styles from './KanbanInsightsPanel.module.css';
import { Sparkles, X, Activity, AlertTriangle } from 'lucide-react';

interface Props {
    lanes: Lane[];
}

const KanbanInsightsPanel: React.FC<Props> = ({ lanes }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const insights = useKanbanIntelligence(lanes);

    return (
        <div className={styles.panelContainer}>
            {isExpanded ? (
                <div className={styles.panel}>
                    <div className={styles.header}>
                        <h3><Sparkles size={18} color="#3b82f6" /> AI Flow Insights</h3>
                        <button className={`${styles.closeBtn} btn btn-outline`} style={{ padding: '0.25rem' }} onClick={() => setIsExpanded(false)}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className={styles.content}>
                        <div className={styles.scoreSection}>
                            <div className={`${styles.scoreValue} ${styles[insights.healthStatus]}`}>
                                {insights.healthScore}
                            </div>
                            <div className={styles.scoreLabel}>Kanban Health Score</div>
                        </div>

                        <div className={styles.metricsRow}>
                            <div className={styles.metricBox}>
                                <div className={styles.metricValue}>{insights.blockedCount}</div>
                                <div className={styles.metricLabel}>Blocked Tasks</div>
                            </div>
                            <div className={styles.metricBox}>
                                <div className={styles.metricValue}>{insights.overdueCount}</div>
                                <div className={styles.metricLabel}>Overdue Tasks</div>
                            </div>
                        </div>

                        <div className={styles.recommendationsSection}>
                            <h4><Activity size={16} /> Smart Recommendations</h4>
                            <ul className={styles.recList}>
                                {insights.recommendations.map((rec, idx) => (
                                    <li key={idx} className={styles.recItem}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.minimizedBadge} onClick={() => setIsExpanded(true)}>
                    <div className={`${styles.statusIndicator} ${styles[insights.healthStatus]}`} />
                    <span>Insights</span>
                    {insights.healthStatus !== 'healthy' && (
                        <AlertTriangle size={14} color={insights.healthStatus === 'critical' ? '#ef4444' : '#f59e0b'} />
                    )}
                </div>
            )}
        </div>
    );
};

export default KanbanInsightsPanel;
