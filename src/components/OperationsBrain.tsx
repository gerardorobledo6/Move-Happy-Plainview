import React, { useMemo } from 'react';
import { Lane } from '../types';
import { calculateRiskForecast, detectFollowUps } from '../utils/predictiveEngine';
import styles from './OperationsBrain.module.css';
import { Brain, AlertCircle, Activity, Zap } from 'lucide-react';

interface Props {
    lanes: Lane[];
}

const OperationsBrain: React.FC<Props> = ({ lanes }) => {
    const insights = useMemo(() => {
        let criticalRisks = 0;
        let blockedTasks = 0;
        let stagnantAccounts = 0;
        let totalActiveCards = 0;

        lanes.forEach(lane => {
            const titleLower = lane.title.toLowerCase();
            const isDone = titleLower.includes('done') || titleLower.includes('archive');
            if (isDone) return;

            lane.cards.forEach(card => {
                totalActiveCards++;
                
                // Risk Check
                const risk = calculateRiskForecast(card, lane.title);
                if (risk && (risk.riskLevel === 'critical' || risk.riskLevel === 'high')) {
                    criticalRisks++;
                }

                // Blocked Check
                if (card.status === 'Blocked') {
                    blockedTasks++;
                }

                // Stagnant Check
                const followUps = detectFollowUps(card, lane.title);
                if (followUps.length > 0 && followUps[0].priority === 'high') {
                    stagnantAccounts++;
                }
            });
        });

        return {
            criticalRisks,
            blockedTasks,
            stagnantAccounts,
            healthScore: totalActiveCards > 0 
                ? Math.max(0, 100 - (criticalRisks * 10) - (blockedTasks * 5)) 
                : 100
        };
    }, [lanes]);

    return (
        <div className={styles.brainContainer}>
            <div className={styles.brainHeader}>
                <Brain size={18} className={styles.brainIcon} />
                <h3>Operations Brain</h3>
            </div>
            
            <div className={styles.healthMeter}>
                <div className={styles.healthLabel}>
                    <span>Workflow Health</span>
                    <span>{insights.healthScore}%</span>
                </div>
                <div className={styles.progressBar}>
                    <div 
                        className={styles.progressFill} 
                        style={{ 
                            width: `${insights.healthScore}%`,
                            backgroundColor: insights.healthScore > 80 ? '#10b981' : insights.healthScore > 50 ? '#f59e0b' : '#ef4444'
                        }} 
                    />
                </div>
            </div>

            <div className={styles.insightGrid}>
                <div className={`${styles.insightItem} ${insights.criticalRisks > 0 ? styles.activeRisk : ''}`}>
                    <AlertCircle size={14} />
                    <div className={styles.insightContent}>
                        <div className={styles.insightValue}>{insights.criticalRisks}</div>
                        <div className={styles.insightLabel}>Critical Risks</div>
                    </div>
                </div>
                <div className={`${styles.insightItem} ${insights.blockedTasks > 0 ? styles.activeBlocked : ''}`}>
                    <Zap size={14} />
                    <div className={styles.insightContent}>
                        <div className={styles.insightValue}>{insights.blockedTasks}</div>
                        <div className={styles.insightLabel}>Blocked Tasks</div>
                    </div>
                </div>
                <div className={`${styles.insightItem} ${insights.stagnantAccounts > 0 ? styles.activeStagnant : ''}`}>
                    <Activity size={14} />
                    <div className={styles.insightContent}>
                        <div className={styles.insightValue}>{insights.stagnantAccounts}</div>
                        <div className={styles.insightLabel}>Idle Accounts</div>
                    </div>
                </div>
            </div>

            {insights.healthScore < 90 && (
                <div className={styles.aiRecommendation}>
                    <div className={styles.aiTag}>AI RECOMMENDS</div>
                    <p>Focus on {insights.criticalRisks > 0 ? 'mitigating urgent risks' : 'clearing blocked bottlenecks'} to improve workflow stability.</p>
                </div>
            )}
        </div>
    );
};

export default OperationsBrain;
