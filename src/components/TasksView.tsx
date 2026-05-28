import React, { useState, useEffect } from 'react';
import styles from './TasksView.module.css';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface TasksViewProps {
    onBack: () => void;
}

const TasksView: React.FC<TasksViewProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('Your Tasks');
    const [filter, setFilter] = useState('All');
    const [tasks, setTasks] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    // Pagination state
    const [currentPage, setCurrentPage] = useState(() => {
        const saved = localStorage.getItem("tasks_current_page");
        return saved ? parseInt(saved, 10) : 1;
    });
    const [isAnimating, setIsAnimating] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const tasksPerPage = 10;

    const handlePageChange = (newPage: number) => {
        if (newPage === currentPage) return;
        setIsAnimating(true);
        setCurrentPage(newPage);
        localStorage.setItem("tasks_current_page", newPage.toString());
        setTimeout(() => setIsAnimating(false), 300);
    };

    // Reset page to 1 when filters or tabs change
    useEffect(() => {
        setCurrentPage(1);
        localStorage.setItem("tasks_current_page", "1");
        setSortConfig(null);
    }, [activeTab, filter]);

    useEffect(() => {
        client.get('/users').then(res => {
            const fetchedUsers = res.data;
            setUsers(fetchedUsers);

            try {
                const stored = localStorage.getItem("tasks");
                if (stored) {
                    let parsedTasks = JSON.parse(stored);
                    let needsMigration = false;
                    
                    parsedTasks = parsedTasks.map((t: any) => {
                        if (t.assigneeName && !t.assigneeId) {
                            needsMigration = true;
                            const match = fetchedUsers.find((u: any) => u.name === t.assigneeName);
                            const newTask = { ...t, assigneeId: match ? match.id : null };
                            delete newTask.assigneeName;
                            return newTask;
                        }
                        return t;
                    });

                    if (needsMigration) {
                        localStorage.setItem("tasks", JSON.stringify(parsedTasks));
                    }
                    setTasks(parsedTasks);
                }
            } catch (e) {
                console.error("Failed to parse tasks from localStorage", e);
            }
        }).catch(err => {
            console.error("Failed to fetch users", err);
            try {
                const stored = localStorage.getItem("tasks");
                if (stored) setTasks(JSON.parse(stored));
            } catch (e) {}
        });
    }, []);

    const handleStatusChange = (taskId: string, newStatus: string) => {
        const updatedTasks = tasks.map(t => 
            t.id === taskId ? { ...t, status: newStatus } : t
        );
        setTasks(updatedTasks);
        try {
            localStorage.setItem("tasks", JSON.stringify(updatedTasks));
        } catch (e) {
            console.error("Failed to save tasks", e);
        }
    };

    const activeTaskCounts = tasks.reduce((acc, t) => {
        if (t.status !== 'Done') {
            acc[t.assigneeId] = (acc[t.assigneeId] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const getTaskScore = (task: any) => {
        let baseScore = 0;

        // --- Base Priority Model ---
        const p = task.priority?.toLowerCase();
        if (p === "critical" || p === "urgent" || p === "high") baseScore += 50;
        else if (p === "medium" || p === "normal") baseScore += 20;
        else if (p === "low") baseScore += 5;

        if (task.pinned) baseScore += 1000;

        const s = task.status?.toLowerCase();
        if (s === "overdue") baseScore += 80;
        else if (s === "in_progress" || s === "pending") baseScore += 30;
        else if (s === "todo") baseScore += 10;

        if (task.createdAt) {
            baseScore += new Date(task.createdAt).getTime() / 100000000;
        }

        // --- AI Priority Boost Engine ---
        let aiBoostScore = 0;
        const now = Date.now();
        const createdMs = task.createdAt ? new Date(task.createdAt).getTime() : now;
        const updatedMs = task.updatedAt ? new Date(task.updatedAt).getTime() : createdMs;

        const daysInactive = (now - updatedMs) / (1000 * 60 * 60 * 24);
        const daysSinceCreated = (now - createdMs) / (1000 * 60 * 60 * 24);

        // 1. Stale task detection
        if (s !== "done") {
            if (daysInactive > 7) aiBoostScore += 50;
            else if (daysInactive > 3) aiBoostScore += 20;
        }

        // 2. Workload pressure
        const userActiveCount = activeTaskCounts[task.assigneeId] || 0;
        if (userActiveCount > 10 && (s === "in_progress" || s === "pending" || s === "overdue")) {
            aiBoostScore += 15;
        }

        // 3. Status aging
        if (s === "in_progress" || s === "pending") {
            if (daysInactive > 3) aiBoostScore += 30;
        } else if (s === "todo") {
            if (daysSinceCreated > 5) aiBoostScore += 20;
        }

        // 4. Deadline proximity intelligence
        if (task.dueDate) {
            const dueMs = new Date(task.dueDate).getTime();
            const hoursToDue = (dueMs - now) / (1000 * 60 * 60);
            
            if (hoursToDue < 0) aiBoostScore += 120;
            else if (hoursToDue <= 24) aiBoostScore += 100;
            else if (hoursToDue <= 72) aiBoostScore += 50;
        }

        // 5. Hidden urgency detection
        const titleLower = (task.taskName || "").toLowerCase();
        if (/(urgent|asap|important|critical)/.test(titleLower)) {
            aiBoostScore += 40;
        }

        return baseScore + aiBoostScore;
    };

    const displayedTasks = tasks.filter(task => {
        // Apply Tab logic
        if (activeTab === 'Your Tasks' && task.assigneeId !== user?.id) {
            return false;
        }
        
        // Apply Dropdown Filter logic
        if (filter !== 'All' && task.status !== filter) {
            return false;
        }

        return true;
    });

    if (sortConfig) {
        displayedTasks.sort((a, b) => {
            let valA: any = a[sortConfig.key];
            let valB: any = b[sortConfig.key];

            if (sortConfig.key === 'assignee') {
                const userA = users.find(u => u.id === a.assigneeId);
                const userB = users.find(u => u.id === b.assigneeId);
                valA = userA ? userA.name : 'Unassigned';
                valB = userB ? userB.name : 'Unassigned';
            } else if (sortConfig.key === 'priority') {
                const pWeights: Record<string, number> = { 'critical': 4, 'urgent': 4, 'high': 3, 'medium': 2, 'normal': 2, 'low': 1 };
                valA = pWeights[a.priority?.toLowerCase()] || 0;
                valB = pWeights[b.priority?.toLowerCase()] || 0;
            } else if (sortConfig.key === 'createdAt') {
                valA = new Date(valA || 0).getTime();
                valB = new Date(valB || 0).getTime();
            } else if (typeof valA === 'string' && typeof valB === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    } else {
        displayedTasks.sort((a, b) => getTaskScore(b) - getTaskScore(a));
    }

    // Pagination calculations
    const totalPages = Math.ceil(displayedTasks.length / tasksPerPage);
    const indexOfLast = currentPage * tasksPerPage;
    const indexOfFirst = indexOfLast - tasksPerPage;
    const currentTasks = displayedTasks.slice(indexOfFirst, indexOfLast);

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    const generateDailyPlan = () => {
        const capacity = 7;
        const myTasks = tasks.filter(t => t.assigneeId === user?.id && t.status?.toLowerCase() !== 'done');
        const sorted = [...myTasks].sort((a, b) => getTaskScore(b) - getTaskScore(a));

        let totalHours = 0;
        let tomorrowHours = 0;
        const today: any[] = [];
        const tomorrow: any[] = [];
        const later: any[] = [];

        for (const task of sorted) {
            let effort = 2;
            const p = task.priority?.toLowerCase();
            if (p === 'critical' || p === 'urgent' || p === 'high') effort = 3;
            else if (p === 'low') effort = 1;

            if (totalHours + effort <= capacity) {
                today.push(task);
                totalHours += effort;
            } else if (tomorrowHours + effort <= capacity) {
                tomorrow.push(task);
                tomorrowHours += effort;
            } else {
                later.push(task);
            }
        }

        return { today, tomorrow, later, totalHours };
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key) {
            if (sortConfig.direction === 'asc') direction = 'desc';
            else {
                setSortConfig(null);
                return;
            }
        }
        setSortConfig({ key, direction });
    };

    const renderSortIcon = (key: string) => {
        if (sortConfig?.key !== key) return <ChevronsUpDown size={14} className={styles.sortIcon} />;
        if (sortConfig.direction === 'asc') return <ChevronUp size={14} className={styles.sortIcon} />;
        return <ChevronDown size={14} className={styles.sortIcon} />;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <button onClick={onBack} className={`${styles.backBtn} btn btn-outline`} style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>← Back to Dashboard</button>
                    <h2>Tasks</h2>
                </div>
                <div className={styles.totalCount}>
                    {displayedTasks.length} tasks total
                </div>
            </div>

            <div className={styles.controls}>
                <div className={styles.tabs}>
                    <button 
                        className={`${styles.tab} ${activeTab === 'Your Tasks' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('Your Tasks')}
                    >
                        Your Tasks
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'All Tasks' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('All Tasks')}
                    >
                        All Tasks
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'Daily Plan' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('Daily Plan')}
                    >
                        AI Daily Plan
                    </button>
                </div>

                <div className={styles.filterSection}>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} className={styles.filterSelect}>
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Done">Done</option>
                    </select>
                </div>
            </div>

            {activeTab === 'Daily Plan' ? (() => {
                const plan = generateDailyPlan();
                return (
                    <div className={styles.plannerContainer}>
                        <div className={styles.planHeader}>
                            <h3>Your AI Daily Plan</h3>
                            <span className={styles.capacityBadge}>{plan.totalHours} / 7 Hours Scheduled</span>
                        </div>
                        
                        <div className={styles.planSection}>
                            <h4>Today</h4>
                            {plan.today.length > 0 ? (
                                <ul className={styles.planList}>
                                    {plan.today.map((task, idx) => (
                                        <li key={task.id} className={styles.planItem}>
                                            <span className={styles.planOrder}>{idx + 1}</span>
                                            <div className={styles.planDetails}>
                                                <strong>{task.taskName}</strong>
                                                <span className={styles.planMeta}>Score: {Math.round(getTaskScore(task))} | {task.priority}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className={styles.emptyPlan}>No tasks scheduled for today.</p>}
                        </div>

                        <div className={styles.planSection}>
                            <h4>Tomorrow</h4>
                            {plan.tomorrow.length > 0 ? (
                                <ul className={styles.planList}>
                                    {plan.tomorrow.map(task => (
                                        <li key={task.id} className={styles.planItem}>
                                            <div className={styles.planDetails}>
                                                <strong>{task.taskName}</strong>
                                                <span className={styles.planMeta}>{task.priority}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className={styles.emptyPlan}>No overflow tasks for tomorrow.</p>}
                        </div>

                        <div className={styles.planSection}>
                            <h4>Later this week</h4>
                            {plan.later.length > 0 ? (
                                <ul className={styles.planList}>
                                    {plan.later.map(task => (
                                        <li key={task.id} className={styles.planItem}>
                                            <div className={styles.planDetails}>
                                                <strong>{task.taskName}</strong>
                                                <span className={styles.planMeta}>{task.priority}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className={styles.emptyPlan}>No backlog tasks.</p>}
                        </div>
                    </div>
                );
            })() : (
                <>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>
                                        <div className={`${styles.sortableHeader} ${sortConfig?.key === 'createdAt' ? styles.activeSort : ''}`} onClick={() => handleSort('createdAt')}>
                                            Date Created {renderSortIcon('createdAt')}
                                        </div>
                                    </th>
                                    <th>
                                        <div className={`${styles.sortableHeader} ${sortConfig?.key === 'assignee' ? styles.activeSort : ''}`} onClick={() => handleSort('assignee')}>
                                            Assignee {renderSortIcon('assignee')}
                                        </div>
                                    </th>
                                    <th>
                                        <div className={`${styles.sortableHeader} ${sortConfig?.key === 'taskName' ? styles.activeSort : ''}`} onClick={() => handleSort('taskName')}>
                                            Task Name {renderSortIcon('taskName')}
                                        </div>
                                    </th>
                                    <th>
                                        <div className={`${styles.sortableHeader} ${sortConfig?.key === 'priority' ? styles.activeSort : ''}`} onClick={() => handleSort('priority')}>
                                            Priority {renderSortIcon('priority')}
                                        </div>
                                    </th>
                                    <th>
                                        <div className={`${styles.sortableHeader} ${sortConfig?.key === 'status' ? styles.activeSort : ''}`} onClick={() => handleSort('status')}>
                                            Status {renderSortIcon('status')}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={isAnimating ? styles.tableBodyFade : ''}>
                                {currentTasks.length > 0 ? currentTasks.map(task => (
                                    <tr key={task.id}>
                                        <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className={styles.assignee}>
                                                <div className={styles.avatar}>
                                                    {(() => {
                                                        const u = users.find(u => u.id === task.assigneeId);
                                                        return u ? u.name.charAt(0) : '?';
                                                    })()}
                                                </div>
                                                <span>
                                                    {(() => {
                                                        const u = users.find(u => u.id === task.assigneeId);
                                                        return u ? u.name : 'Unassigned';
                                                    })()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={styles.taskName}>{task.taskName}</td>
                                        <td>
                                            <span className={`${styles.priority} ${styles[task.priority?.toLowerCase()] || styles.normal}`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td>
                                            <select 
                                                value={task.status} 
                                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                className={styles.statusSelect}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Done">Done</option>
                                            </select>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                            No tasks found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.pagination}>
                        <button 
                            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} 
                            disabled={currentPage === 1}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                        >
                            Previous
                        </button>
                        <div className={styles.pageNumbers}>
                            {getPageNumbers().map((num, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => typeof num === 'number' && handlePageChange(num)}
                                    className={`${styles.numBtn} ${num === currentPage ? styles.activeNum : ''} ${num === '...' ? styles.dots : ''}`}
                                    disabled={num === '...'}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))} 
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default TasksView;
