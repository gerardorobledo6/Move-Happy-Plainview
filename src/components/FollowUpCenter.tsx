import React, { useMemo, useState } from 'react';
import { Lane, Card } from '../types';
import styles from './FollowUpCenter.module.css';
import client from '../api/client';
import { ChevronLeft, CheckCircle, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface FollowUpCenterProps {
    lanes: Lane[];
    onBack: () => void;
    onRefresh: () => void;
}

interface FollowUpItem {
    card: Card;
    pickupDate: Date;
    lastFollowUpDate: Date | null;
    nextDueDate: Date;
    status: 'Up to Date' | 'Needs Follow Up' | 'Urgent Follow Up';
    daysSinceLastFollowUp: number;
}

const FOLLOW_UP_MARKER = '✅ Follow-up completed';

export default function FollowUpCenter({ lanes, onBack, onRefresh }: FollowUpCenterProps) {
    const [isLogging, setIsLogging] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [selectedAssignee, setSelectedAssignee] = useState<string | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    // For optimistic instant UI updates
    const [localOverrides, setLocalOverrides] = useState<Record<string, { lastFollowUpDate: Date }>>({});
    
    // Toast notification state
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const followUpItems = useMemo(() => {
        const items: FollowUpItem[] = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalize to start of day for accurate day comparisons

        lanes.forEach(lane => {
            lane.cards.forEach(card => {
                if (!card.pickupDate) return;
                
                // Skip cards that are completely resolved/archived if you want, 
                // but let's assume if it has a pickup date, we track it unless it's in a 'done' state.
                if (card.resolvedAt) return;

                const pickupDate = new Date(card.pickupDate);
                let lastFollowUpDate: Date | null = null;
                
                // Read from new dedicated FollowUp model
                if (card.followUp) {
                    lastFollowUpDate = new Date(card.followUp.lastFollowUpDate);
                } 
                // Fallback to comments logic for old data
                else if (card.comments && card.comments.length > 0) {
                    const followUpComments = card.comments
                        .filter(c => c.content.startsWith(FOLLOW_UP_MARKER))
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    
                    if (followUpComments.length > 0) {
                        const latestComment = followUpComments[0];
                        const parts = latestComment.content.split(': ');
                        if (parts.length > 1 && parts[1].match(/^\d{4}-\d{2}-\d{2}$/)) {
                            const [y, m, d] = parts[1].split('-').map(Number);
                            lastFollowUpDate = new Date(y, m - 1, d);
                        } else {
                            lastFollowUpDate = new Date(latestComment.createdAt);
                        }
                    }
                }

                // Check for optimistic overrides so UI updates instantly
                if (localOverrides[card.id]) {
                    lastFollowUpDate = localOverrides[card.id].lastFollowUpDate;
                }

                const baseDate = lastFollowUpDate || pickupDate;
                const nextDueDate = new Date(baseDate);
                nextDueDate.setDate(nextDueDate.getDate() + 7);
                nextDueDate.setHours(0, 0, 0, 0);

                const diffTime = now.getTime() - baseDate.getTime();
                const daysSinceLastFollowUp = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                let status: 'Up to Date' | 'Needs Follow Up' | 'Urgent Follow Up';
                if (daysSinceLastFollowUp >= 10) {
                    status = 'Urgent Follow Up';
                } else if (daysSinceLastFollowUp >= 7) {
                    status = 'Needs Follow Up';
                } else {
                    status = 'Up to Date';
                }

                items.push({
                    card,
                    pickupDate,
                    lastFollowUpDate,
                    nextDueDate,
                    status,
                    daysSinceLastFollowUp
                });
            });
        });

        // Sort by most urgent (highest days since follow up)
        return items.sort((a, b) => b.daysSinceLastFollowUp - a.daysSinceLastFollowUp);
    }, [lanes, localOverrides]);

    const availableMonths = useMemo(() => {
        const months = new Set<number>();
        followUpItems.forEach(item => {
            months.add(item.pickupDate.getMonth());
        });
        return Array.from(months).sort((a, b) => a - b);
    }, [followUpItems]);

    const availableAssignees = useMemo(() => {
        const assignees = new Map<string, { id: string, name: string }>();
        followUpItems.forEach(item => {
            item.card.assignedUsers?.forEach(user => {
                if (!assignees.has(user.id)) {
                    assignees.set(user.id, user);
                }
            });
        });
        return Array.from(assignees.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [followUpItems]);

    const filteredItems = useMemo(() => {
        return followUpItems.filter(item => {
            const matchesMonth = selectedMonth === null || item.pickupDate.getMonth() === selectedMonth;
            const matchesAssignee = selectedAssignee === 'all' || item.card.assignedUsers?.some(u => u.id === selectedAssignee);
            
            const searchLower = searchQuery.toLowerCase().trim();
            const matchesSearch = !searchLower || 
                item.card.title.toLowerCase().includes(searchLower) ||
                (item.card.orderNumber && item.card.orderNumber.toLowerCase().includes(searchLower)) ||
                item.card.assignedUsers?.some(u => u.name.toLowerCase().includes(searchLower));

            return matchesMonth && matchesAssignee && matchesSearch;
        });
    }, [followUpItems, selectedMonth, selectedAssignee, searchQuery]);

    const stats = useMemo(() => {
        return {
            pending: filteredItems.filter(i => i.status === 'Needs Follow Up' || i.status === 'Urgent Follow Up').length,
            upToDate: filteredItems.filter(i => i.status === 'Up to Date').length,
            total: filteredItems.length
        };
    }, [filteredItems]);

    const handleLogFollowUp = async (cardId: string, customDateStr?: string) => {
        setIsLogging(cardId);
        
        // Optimistic UI Update
        const [y, m, d] = customDateStr ? customDateStr.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];
        const newLastFollowUpDate = new Date(y, m - 1, d);
        
        const newNextDueDate = new Date(newLastFollowUpDate);
        newNextDueDate.setDate(newNextDueDate.getDate() + 7);
        newNextDueDate.setHours(0, 0, 0, 0);

        setLocalOverrides(prev => ({
            ...prev,
            [cardId]: { lastFollowUpDate: newLastFollowUpDate }
        }));

        try {
            // 1. Persist to dedicated FollowUp table with UPSERT
            const payload = {
                lastFollowUpDate: newLastFollowUpDate.toISOString(),
                nextFollowUpDate: newNextDueDate.toISOString()
            };
            await client.put(`/cards/${cardId}/followup`, payload);

            // 2. Add history comment (fire and forget)
            const content = customDateStr ? `${FOLLOW_UP_MARKER}: ${customDateStr}` : FOLLOW_UP_MARKER;
            client.post(`/cards/${cardId}/comments`, { content }).catch(e => console.error("Comment history failed:", e));
            
            showToast("Follow-up updated", "success");
            onRefresh(); // Keep backend and frontend in sync silently
        } catch (error) {
            console.error("Failed to log follow-up", error);
            showToast("Unable to save follow-up. Please try again.", "error");
            
            // Revert optimistic update on failure
            setLocalOverrides(prev => {
                const copy = { ...prev };
                delete copy[cardId];
                return copy;
            });
        } finally {
            setIsLogging(null);
        }
    };

    const formatDate = (d: Date) => {
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatForInput = (d: Date | null) => {
        if (!d) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const renderCompactRow = (item: FollowUpItem) => (
        <div key={item.card.id} className={styles.compactRow}>
            {/* 1. Status */}
            <div className={styles.compactStatus}>
                {item.status === 'Urgent Follow Up' && <span className={`${styles.statusPill} ${styles.urgentFollowUpPill}`}><AlertTriangle size={12} /> {item.status}</span>}
                {item.status === 'Needs Follow Up' && <span className={`${styles.statusPill} ${styles.needsFollowUpPill}`}><Clock size={12} /> {item.status}</span>}
                {item.status === 'Up to Date' && <span className={`${styles.statusPill} ${styles.upToDatePill}`}><CheckCircle size={12} /> {item.status}</span>}
            </div>

            {/* 2. Title */}
            <div className={styles.compactTitleArea}>
                <span className={styles.compactTitle} title={item.card.title}>{item.card.title}</span>
            </div>

            {/* 3. Order Number */}
            <div className={styles.compactOrderNum}>
                {item.card.orderNumber && <span className={styles.orderNumber}>{item.card.orderNumber}</span>}
            </div>

            {/* 4. Pickup Date */}
            <div className={styles.compactPickup}>
                <span className={styles.compactLabel}>Pickup</span>
                <span className={styles.pickupDateValue}>{formatDate(item.pickupDate)}</span>
            </div>

            {/* 5. Last Follow-Up */}
            <div className={styles.compactLast}>
                <span className={styles.compactLabel}>Last FU</span>
                <input 
                    type="date" 
                    className={styles.compactDateInput}
                    value={formatForInput(item.lastFollowUpDate)}
                    onChange={(e) => {
                        if(e.target.value) handleLogFollowUp(item.card.id, e.target.value);
                    }}
                />
            </div>

            {/* 6. Next Follow-Up */}
            <div className={styles.compactNext}>
                <span className={styles.compactLabel}>Next FU</span>
                <span className={styles.nextDateValue}>{formatDate(item.nextDueDate)}</span>
            </div>

            {/* 7. Assignee (FULL NAME) */}
            <div className={styles.compactAssignee}>
                {item.card.assignedUsers && item.card.assignedUsers.length > 0 ? (
                    <div className={styles.assigneeWrapper}>
                        <div 
                            className={styles.avatarMini} 
                            style={{ backgroundColor: item.card.assignedUsers[0].avatarColor || '#018ABE' }}
                        >
                            {item.card.assignedUsers[0].name.charAt(0)}
                        </div>
                        <span className={styles.assigneeName}>{item.card.assignedUsers[0].name}</span>
                        {item.card.assignedUsers.length > 1 && (
                            <span className={styles.assigneeCount}>+{item.card.assignedUsers.length - 1}</span>
                        )}
                    </div>
                ) : (
                    <span className={styles.unassigned}>Unassigned</span>
                )}
            </div>

            <button 
                className={styles.compactLogButton} 
                onClick={() => handleLogFollowUp(item.card.id)}
                disabled={isLogging === item.card.id}
                title="Log Follow-Up"
            >
                {isLogging === item.card.id ? '...' : <CheckCircle size={16} />}
            </button>
        </div>
    );

    return (
        <div className={styles.container}>
            {toast && (
                <div className={`${styles.toast} ${styles[toast.type]}`}>
                    <CheckCircle size={16} />
                    {toast.message}
                </div>
            )}
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={onBack}>
                    <ChevronLeft size={20} />
                    Back to Dashboard
                </button>
                <div className={styles.headerContent}>
                    <div className={styles.titleArea}>
                        <h1>Follow-Up Center</h1>
                        <p>Automated 7-day post-pickup cycle management</p>
                    </div>

                    <div className={styles.kpiContainer}>
                        <div className={`${styles.kpiCard} ${styles.pendingKpi}`}>
                            <div className={styles.kpiInner}>
                                <span className={styles.kpiValue}>{stats.pending}</span>
                                <span className={styles.kpiLabel}>Pending Follow-Ups</span>
                            </div>
                            <div className={styles.kpiGlow} />
                        </div>
                        <div className={`${styles.kpiCard} ${styles.upToDateKpi}`}>
                            <div className={styles.kpiInner}>
                                <span className={styles.kpiValue}>{stats.upToDate}</span>
                                <span className={styles.kpiLabel}>Up to Date</span>
                            </div>
                            <div className={styles.kpiGlow} />
                        </div>
                        <div className={`${styles.kpiCard} ${styles.totalKpi}`}>
                            <div className={styles.kpiInner}>
                                <span className={styles.kpiValue}>{stats.total}</span>
                                <span className={styles.kpiLabel}>Total Records</span>
                            </div>
                            <div className={styles.kpiGlow} />
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.filterBar}>
                    <div className={styles.filterGroup}>
                        <select 
                            value={selectedMonth === null ? 'all' : selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? null : Number(e.target.value))}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Months ▼</option>
                            {availableMonths.map(m => (
                                <option key={m} value={m}>{MONTH_NAMES[m]}</option>
                            ))}
                        </select>

                        <select 
                            value={selectedAssignee} 
                            onChange={(e) => setSelectedAssignee(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Assignees ▼</option>
                            {availableAssignees.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.searchContainer}>
                        <input 
                            type="text" 
                            placeholder="Search client or order..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                {filteredItems.length === 0 ? (
                    <div className={styles.emptyState}>
                        <CheckCircle size={48} className={styles.emptyIcon} />
                        <h2>All Caught Up!</h2>
                        <p>There are no follow-ups matching your current filters.</p>
                    </div>
                ) : (
                    <div className={styles.singleListContainer}>
                        <div className={styles.compactList}>
                            {filteredItems.map(renderCompactRow)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
