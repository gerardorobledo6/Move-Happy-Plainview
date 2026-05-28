import React, { useState, useEffect } from 'react';
import { Lane, Card } from '../types';
import { useKanbanIntelligence } from '../utils/useKanbanIntelligence';
import styles from './ExecutiveDashboard.module.css';
import { BarChart2, PieChart, Activity, CheckCircle, Clock, AlertTriangle, TrendingUp, Users, Shield, Zap, FileText, ClipboardList } from 'lucide-react';

interface Props {
    lanes: Lane[];
    onBack: () => void;
}

const ExecutiveDashboard: React.FC<Props> = ({ lanes, onBack }) => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [tasks, setTasks] = useState<any[]>([]);
    const insights = useKanbanIntelligence(lanes);

    useEffect(() => {
        const stored = localStorage.getItem("tasks");
        if (stored) {
            try {
                setTasks(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse tasks", e);
            }
        }
    }, []);

    const allCards = React.useMemo(() => lanes.flatMap(lane => lane.cards), [lanes]);
    const totalCards = allCards.length;
    
    const priorityCounts = React.useMemo(() => {
        const counts: Record<string, number> = { 'Low': 0, 'Normal': 0, 'High': 0, 'Urgent': 0 };
        allCards.forEach(card => {
            if (counts[card.priority] !== undefined) {
                counts[card.priority]++;
            }
        });
        return counts;
    }, [allCards]);

    const statusCounts = React.useMemo(() => {
        const counts = { 'Blocked': 0, 'Unblocked': 0 };
        allCards.forEach(card => {
            if (card.status === 'Blocked') counts.Blocked++;
            else counts.Unblocked++;
        });
        return counts;
    }, [allCards]);

    const laneDistribution = React.useMemo(() => {
        return lanes.map(lane => ({
            title: lane.title,
            count: lane.cards.length,
            percentage: totalCards > 0 ? Math.round((lane.cards.length / totalCards) * 100) : 0
        }));
    }, [lanes, totalCards]);

    return (
        <div className={styles.dashboardContainer}>
            <button onClick={onBack} className={`${styles.backBtn} btn btn-outline`} style={{ alignSelf: 'flex-start', marginBottom: '1rem', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>← Back to Dashboard</button>
            <div className={styles.header}>
                <div className={styles.titleArea}>
                    <h1>Executive Operations Dashboard</h1>
                    <p>High-level operational intelligence & performance metrics</p>
                </div>
                <div className={styles.headerMetrics}>
                    <div className={styles.headerMetricCard}>
                        <Shield size={20} color="#10b981" />
                        <div>
                            <span className={styles.headerMetricLabel}>System Status</span>
                            <span className={styles.headerMetricValue}>Optimal</span>
                        </div>
                    </div>
                    <div className={styles.headerMetricCard}>
                        <Zap size={20} color="#f59e0b" />
                        <div>
                            <span className={styles.headerMetricLabel}>Active Pulsar</span>
                            <span className={styles.headerMetricValue}>Normal</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.tabsBar}>
                {['Overview', 'Cards', 'Tasks', 'Agents', 'AI Insights'].map(tab => (
                    <button 
                        key={tab} 
                        className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'Overview' && (
                <>
                    <div className={styles.grid}>
                        {/* KPI Cards */}
                        <div className={`${styles.card} ${styles.kpiCard}`}>
                            <div className={styles.cardHeader}>
                                <h3>Total Operations</h3>
                                <Activity size={20} color="#3b82f6" />
                            </div>
                            <div className={styles.kpiValue}>{totalCards}</div>
                            <div className={styles.kpiSubtext}>Active accounts in pipeline</div>
                        </div>

                        <div className={`${styles.card} ${styles.kpiCard}`}>
                            <div className={styles.cardHeader}>
                                <h3>Health Score</h3>
                                <TrendingUp size={20} color="#10b981" />
                            </div>
                            <div className={`${styles.kpiValue} ${styles[insights.healthStatus]}`}>
                                {insights.healthScore}
                            </div>
                            <div className={styles.kpiSubtext}>Overall flow efficiency</div>
                        </div>

                        <div className={`${styles.card} ${styles.kpiCard}`}>
                            <div className={styles.cardHeader}>
                                <h3>Blocked Items</h3>
                                <AlertTriangle size={20} color="#ef4444" />
                            </div>
                            <div className={styles.kpiValue}>{insights.blockedCount}</div>
                            <div className={styles.kpiSubtext}>Requiring immediate action</div>
                        </div>

                        <div className={`${styles.card} ${styles.kpiCard}`}>
                            <div className={styles.cardHeader}>
                                <h3>Overdue Tasks</h3>
                                <Clock size={20} color="#f59e0b" />
                            </div>
                            <div className={styles.kpiValue}>{insights.overdueCount}</div>
                            <div className={styles.kpiSubtext}>Past planned finish date</div>
                        </div>
                    </div>

                    <div className={styles.mainGrid}>
                        {/* Priority Distribution */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3>Priority Distribution</h3>
                                <BarChart2 size={20} color="#6366f1" />
                            </div>
                            <div className={styles.barChartContainer}>
                                {Object.entries(priorityCounts).map(([priority, count]) => {
                                    const percentage = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0;
                                    return (
                                        <div key={priority} className={styles.chartRow}>
                                            <div className={styles.chartLabel}>{priority}</div>
                                            <div className={styles.chartBarWrapper}>
                                                <div 
                                                    className={`${styles.chartBar} ${styles[priority.toLowerCase()]}`} 
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <div className={styles.chartValue}>{count} ({percentage}%)</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pipeline Distribution */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3>Pipeline Distribution</h3>
                                <PieChart size={20} color="#8b5cf6" />
                            </div>
                            <div className={styles.distributionList}>
                                {laneDistribution.map((lane, index) => (
                                    <div key={index} className={styles.distItem}>
                                        <div className={styles.distLabel}>{lane.title}</div>
                                        <div className={styles.distBarWrapper}>
                                            <div 
                                                className={styles.distBar} 
                                                style={{ width: `${lane.percentage}%`, backgroundColor: `hsl(${210 + index * 15}, 70%, 50%)` }}
                                            />
                                        </div>
                                        <div className={styles.distValue}>{lane.count} ({lane.percentage}%)</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'Cards' && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>Active Cards</h3>
                        <ClipboardList size={20} color="#3b82f6" />
                    </div>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Lane</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allCards.map(card => (
                                    <tr key={card.id}>
                                        <td>{card.headerId}</td>
                                        <td>{card.title}</td>
                                        <td>{card.priority}</td>
                                        <td>{card.status}</td>
                                        <td>{lanes.find(l => l.id === card.laneId)?.title}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'Tasks' && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>System Tasks</h3>
                        <FileText size={20} color="#3b82f6" />
                    </div>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Task</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.length > 0 ? tasks.map(task => (
                                    <tr key={task.id}>
                                        <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                                        <td>{task.taskName}</td>
                                        <td>{task.priority}</td>
                                        <td>{task.status}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No tasks found in system.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'Agents' && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>Agent Workload</h3>
                        <Users size={20} color="#3b82f6" />
                    </div>
                    <div className={styles.barChartContainer}>
                        {(() => {
                            const workload: Record<string, number> = {};
                            allCards.forEach(card => {
                                card.assignedUsers.forEach(user => {
                                    workload[user.name] = (workload[user.name] || 0) + 1;
                                });
                            });
                            const maxWorkload = Math.max(...Object.values(workload), 1);
                            return Object.entries(workload).map(([name, count]) => {
                                const percentage = Math.round((count / maxWorkload) * 100);
                                return (
                                    <div key={name} className={styles.chartRow}>
                                        <div className={styles.chartLabel}>{name}</div>
                                        <div className={styles.chartBarWrapper}>
                                            <div 
                                                className={styles.chartBar} 
                                                style={{ width: `${percentage}%`, backgroundColor: '#3b82f6' }}
                                            />
                                        </div>
                                        <div className={styles.chartValue}>{count} cases</div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}

            {activeTab === 'AI Insights' && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>Operational Intelligence Insights</h3>
                        <Zap size={20} color="#f59e0b" />
                    </div>
                    {insights.recommendations.length > 0 ? (
                        <ul className={styles.recList}>
                            {insights.recommendations.map((rec, index) => (
                                <li key={index} className={styles.recItem}>
                                    <AlertTriangle size={16} color="#f59e0b" style={{ marginRight: '0.5rem', flexShrink: 0 }} />
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className={styles.emptyRecs}>
                            <CheckCircle size={24} color="#10b981" />
                            <p>No critical issues detected. Operations are running smoothly.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExecutiveDashboard;
