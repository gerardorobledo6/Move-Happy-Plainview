import React, { useState } from 'react';
import { useExecutionPlanner, PlannedCard } from '../utils/useExecutionPlanner';
import { Lane, User } from '../types';
import styles from './DailyExecutionPlanner.module.css';
import { Clock, Calendar, AlertCircle, Circle, CheckCircle2, Flame, AlertTriangle, PlayCircle, Sparkles, ShieldAlert, Phone, Mail, Zap } from 'lucide-react';

interface Props {
    lanes: Lane[];
    currentUser: User | null;
    onBack: () => void;
    onResolveTask?: (taskId: string) => void;
}

const DailyExecutionPlanner: React.FC<Props> = ({ lanes, currentUser, onBack, onResolveTask }) => {
    const plan = useExecutionPlanner(lanes, currentUser);
    const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
    const [selectedPriority, setSelectedPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL' | null>(null);

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const handlePriorityToggle = (priority: 'URGENT' | 'HIGH' | 'NORMAL') => {
        setSelectedPriority(prev => prev === priority ? null : priority);
    };

    const AgendaCard: React.FC<{ card: PlannedCard; onResolve: (id: string) => void; focused: boolean; onFocus: (id: string) => void }> = ({ card, onResolve, focused, onFocus }) => {
        const [isResolving, setIsResolving] = useState(false);

        const handleResolve = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (isResolving) return;
            setIsResolving(true);
            setTimeout(() => {
                onResolve(card.id);
            }, 300);
        };

        return (
            <div 
                className={`${styles.agendaCard} ${focused ? styles.focused : ''}`}
                onClick={() => onFocus(card.id)}
            >
                <div className={styles.cardLeft}>
                    <div className={styles.cardIcon}>
                        {focused ? <PlayCircle size={20} /> : <Circle size={20} />}
                    </div>
                    <div className={styles.cardInfo}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className={styles.cardTitle}>{card.title}</div>
                            {card.riskForecast && card.riskForecast.riskLevel !== 'low' && (
                                <div 
                                    className={`${styles.riskBadge} ${styles[card.riskForecast.riskLevel]}`}
                                    title={card.riskForecast.explanation}
                                >
                                    <ShieldAlert size={12} />
                                    <span>Risk: {card.riskForecast.riskLevel}</span>
                                </div>
                            )}
                        </div>
                        <div className={styles.workflowContext}>
                            <span className={styles.workflowColumn}>Column: {card.columnName}</span>
                            <span className={styles.workflowDivider}>•</span>
                            <span className={styles.workflowLabel}>{card.workflowStatusLabel}</span>
                            <span className={styles.workflowDivider}>•</span>
                            <span className={styles.workflowTime}>{card.timeContext}</span>
                        </div>
                        <div className={styles.aiExplanation}>
                            <Sparkles size={12} className={styles.aiIcon} />
                            {card.aiUrgencyExplanation}
                        </div>
                    </div>
                </div>
                
                <div className={styles.cardRight}>
                    {card.orderNumber && (
                        <div className={styles.orderNumber}>
                            #{card.orderNumber}
                        </div>
                    )}
                    
                    {card.status === 'Blocked' && (
                        <div className={`${styles.statusIndicator} ${styles.blocked}`}>
                            <AlertCircle size={14} /> Blocked
                        </div>
                    )}
                    
                    {card.pickupDate && (
                        <div className={styles.dateBadge}>
                            <Calendar size={12} />
                            <span>{new Date(card.pickupDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                    )}

                    <div className={styles.dateBadge}>
                        <Clock size={12} />
                        <span>{card.estimatedHours}h</span>
                    </div>

                    <div className={`${styles.priorityBadge} ${styles[card.dynamicPriority.toLowerCase()]}`}>
                        {card.dynamicPriority}
                    </div>

                    <button 
                        className={`${styles.resolveBtn} ${isResolving ? styles.resolved : ''} btn`}
                        onClick={handleResolve}
                    >
                        {isResolving ? (
                            <><CheckCircle2 size={14} /> Resolved</>
                        ) : (
                            <><Circle size={14} /> Pending</>
                        )}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleArea}>
                    <button onClick={onBack} className={`${styles.backBtn} btn btn-outline`}>← Back to Dashboard</button>
                    <div className={styles.titleContent}>
                        <div className={styles.date}>{today}</div>
                        <h1>Daily Focus Agenda</h1>
                    </div>
                </div>

                <div className={styles.metricsRow}>
                    <div className={styles.miniStats}>
                        <div 
                            className={`${styles.statItem} ${styles.urgent} ${selectedPriority === 'URGENT' ? styles.active : (selectedPriority !== null ? styles.muted : '')}`} 
                            title="Urgent Tasks"
                            onClick={() => handlePriorityToggle('URGENT')}
                        >
                            <Flame size={14} />
                            <span>{plan.urgent.length} Urgent</span>
                        </div>
                        <div 
                            className={`${styles.statItem} ${styles.high} ${selectedPriority === 'HIGH' ? styles.active : (selectedPriority !== null ? styles.muted : '')}`} 
                            title="High Priority"
                            onClick={() => handlePriorityToggle('HIGH')}
                        >
                            <AlertTriangle size={14} />
                            <span>{plan.high.length} High</span>
                        </div>
                        <div 
                            className={`${styles.statItem} ${styles.normal} ${selectedPriority === 'NORMAL' ? styles.active : (selectedPriority !== null ? styles.muted : '')}`} 
                            title="Normal Priority"
                            onClick={() => handlePriorityToggle('NORMAL')}
                        >
                            <CheckCircle2 size={14} />
                            <span>{plan.normal.length} Normal</span>
                        </div>
                        <div 
                            className={`${styles.statItem} ${styles.total} ${selectedPriority === null ? styles.active : styles.muted}`} 
                            title="Total Tasks Today"
                            onClick={() => setSelectedPriority(null)}
                        >
                            <Clock size={14} />
                            <span>{plan.executionOrder.length} Total</span>
                        </div>
                    </div>
                </div>
            </div>

            {plan.executionOrder.length === 0 ? (
                <div className={styles.emptyState}>
                    <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                    <h2>You're all caught up!</h2>
                    <p>No tasks assigned to you for execution today.</p>
                </div>
            ) : (
                <div className={styles.agendaContainer}>
                    {(selectedPriority === null) && plan.followUpAgenda.length > 0 && (
                        <div className={styles.agendaSection}>
                            <div className={`${styles.sectionHeader} ${styles.followUp}`}>
                                <Phone size={18} /> 📞 Follow-Ups Needed Today
                            </div>
                            <div className={styles.aiAgendaGrid}>
                                {plan.followUpAgenda.map((followUp, idx) => (
                                    <div key={`${followUp.cardId}-${idx}`} className={styles.aiActionCard}>
                                        <div className={`${styles.actionIcon} ${styles.follow_up}`}>
                                            <Mail size={16} />
                                        </div>
                                        <div className={styles.actionContent}>
                                            <div className={styles.actionTitle}>{followUp.cardTitle}</div>
                                            <div className={styles.actionReason}>{followUp.reason}</div>
                                        </div>
                                        <div className={`${styles.actionPriority} ${styles[followUp.priority]}`}>
                                            {followUp.daysSinceLastActivity}d idle
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    {(selectedPriority === null || selectedPriority === 'URGENT') && plan.urgent.length > 0 && (
                        <div className={styles.agendaSection}>
                            <div className={`${styles.sectionHeader} ${styles.urgent}`}>
                                <Flame size={18} /> First Priority: Urgent
                            </div>
                            {plan.urgent.map(card => (
                                <AgendaCard 
                                    key={card.id} 
                                    card={card} 
                                    onResolve={(id) => onResolveTask?.(id)}
                                    focused={focusedTaskId === card.id}
                                    onFocus={setFocusedTaskId}
                                />
                            ))}
                        </div>
                    )}

                    {(selectedPriority === null || selectedPriority === 'HIGH') && plan.high.length > 0 && (
                        <div className={styles.agendaSection}>
                            <div className={`${styles.sectionHeader} ${styles.high}`}>
                                <AlertTriangle size={18} /> Second Priority: High
                            </div>
                            {plan.high.map(card => (
                                <AgendaCard 
                                    key={card.id} 
                                    card={card} 
                                    onResolve={(id) => onResolveTask?.(id)}
                                    focused={focusedTaskId === card.id}
                                    onFocus={setFocusedTaskId}
                                />
                            ))}
                        </div>
                    )}

                    {(selectedPriority === null || selectedPriority === 'NORMAL') && plan.normal.length > 0 && (
                        <div className={styles.agendaSection}>
                            <div className={`${styles.sectionHeader} ${styles.normal}`}>
                                <CheckCircle2 size={18} /> Third Priority: Normal
                            </div>
                            {plan.normal.map(card => (
                                <AgendaCard 
                                    key={card.id} 
                                    card={card} 
                                    onResolve={(id) => onResolveTask?.(id)}
                                    focused={focusedTaskId === card.id}
                                    onFocus={setFocusedTaskId}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DailyExecutionPlanner;
