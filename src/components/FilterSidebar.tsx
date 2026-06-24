import styles from './FilterSidebar.module.css';
import { User, Lane } from '../types';

import { ChevronRight, Search, PanelLeft, Users, Calendar, Flag } from 'lucide-react';
import { useState } from 'react';
import PriorityChart from './PriorityChart';

interface FilterState {
    search: string;
    userIds: string[];
    priorities: string[];
    plannedStart: string;
    plannedFinish: string;
}

interface Props {
    isOpen: boolean;
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    users: User[];
    lanes: Lane[];
    onToggleSidebar: () => void;
}

const FilterSidebar: React.FC<Props> = ({ isOpen, filters, setFilters, users, lanes, onToggleSidebar }) => {
    const [isUsersExpanded, setIsUsersExpanded] = useState(false);
    const [isPriorityExpanded, setIsPriorityExpanded] = useState(false);
    const [isPlannedStartExpanded, setIsPlannedStartExpanded] = useState(false);
    const [isPlannedFinishExpanded, setIsPlannedFinishExpanded] = useState(false);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    const toggleUser = (userId: string) => {
        setFilters(prev => ({
            ...prev,
            userIds: prev.userIds.includes(userId)
                ? prev.userIds.filter(id => id !== userId)
                : [...prev.userIds, userId]
        }));
    };

    const togglePriority = (priority: string) => {
        setFilters(prev => ({
            ...prev,
            priorities: prev.priorities.includes(priority)
                ? prev.priorities.filter(p => p !== priority)
                : [...prev.priorities, priority]
        }));
    };

    return (
        <div className={`${styles.sidebar} ${!isOpen ? styles.collapsed : ''}`}>
            <div className={styles.section}>
                <h3>Search</h3>
                <div className={styles.searchWrapper}>
                    <div className={styles.searchContainer}>
                        <Search size={14} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Client Name or ID..."
                            value={filters.search}
                            onChange={handleSearchChange}
                            className={styles.input}
                        />
                    </div>
                    <button onClick={onToggleSidebar} className={styles.filterBtn}>
                        <PanelLeft size={16} />
                    </button>
                </div>
            </div>

            {isOpen && (
                <>
                    <div className={styles.filterCard}>
                        <div className={styles.filterHeader} onClick={() => setIsUsersExpanded(!isUsersExpanded)}>
                            <div>
                                <div className={styles.filterTitle}>
                                    <Users size={14} /> Assigned User
                                </div>
                                {!isUsersExpanded && (
                                    <div className={styles.filterPreview}>
                                        {filters.userIds.length > 0
                                            ? filters.userIds.map(id => users.find(u => u.id === id)?.name).join(', ')
                                            : 'Any user'}
                                    </div>
                                )}
                            </div>
                            <ChevronRight size={16} style={{ transition: 'transform 0.2s', transform: isUsersExpanded ? 'rotate(90deg)' : 'none', color: '#94a3b8' }} />
                        </div>
                        {isUsersExpanded && (
                            <div className={styles.filterContent}>
                                <div className={styles.list}>
                                    {users.map(u => (
                                        <label key={u.id} className={styles.checkbox}>
                                            <input
                                                type="checkbox"
                                                checked={filters.userIds.includes(u.id)}
                                                onChange={() => toggleUser(u.id)}
                                            />
                                            <span className={styles.avatar} style={{ backgroundColor: u.avatarColor }}>{u.name.charAt(0)}</span>
                                            {u.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.filterCard}>
                        <div className={styles.filterHeader} onClick={() => setIsPlannedStartExpanded(!isPlannedStartExpanded)}>
                            <div>
                                <div className={styles.filterTitle}>
                                    <Calendar size={14} /> Planned Start
                                </div>
                                {!isPlannedStartExpanded && (
                                    <div className={styles.filterPreview}>
                                        {filters.plannedStart || 'Not set'}
                                    </div>
                                )}
                            </div>
                            <ChevronRight size={16} style={{ transition: 'transform 0.2s', transform: isPlannedStartExpanded ? 'rotate(90deg)' : 'none', color: '#94a3b8' }} />
                        </div>
                        {isPlannedStartExpanded && (
                            <div className={styles.filterContent}>
                                <div className={styles.list}>
                                    <input
                                        type="date"
                                        value={filters.plannedStart}
                                        onChange={(e) => setFilters(prev => ({ ...prev, plannedStart: e.target.value }))}
                                        onClick={(e) => {
                                            try {
                                                if ('showPicker' in HTMLInputElement.prototype) {
                                                    (e.target as HTMLInputElement).showPicker();
                                                }
                                            } catch (err) {}
                                        }}
                                        className={styles.input}
                                        style={{ padding: '0.25rem', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}
                                    />
                                    {filters.plannedStart && (
                                        <button onClick={() => setFilters(prev => ({ ...prev, plannedStart: '' }))} className="btn btn-outline" style={{width: '100%', fontSize: '11px', padding: '4px'}}>
                                            Clear Filter
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.filterCard}>
                        <div className={styles.filterHeader} onClick={() => setIsPlannedFinishExpanded(!isPlannedFinishExpanded)}>
                            <div>
                                <div className={styles.filterTitle}>
                                    <Calendar size={14} /> Planned Finish
                                </div>
                                {!isPlannedFinishExpanded && (
                                    <div className={styles.filterPreview}>
                                        {filters.plannedFinish || 'Not set'}
                                    </div>
                                )}
                            </div>
                            <ChevronRight size={16} style={{ transition: 'transform 0.2s', transform: isPlannedFinishExpanded ? 'rotate(90deg)' : 'none', color: '#94a3b8' }} />
                        </div>
                        {isPlannedFinishExpanded && (
                            <div className={styles.filterContent}>
                                <div className={styles.list}>
                                    <input
                                        type="date"
                                        value={filters.plannedFinish}
                                        onChange={(e) => setFilters(prev => ({ ...prev, plannedFinish: e.target.value }))}
                                        onClick={(e) => {
                                            try {
                                                if ('showPicker' in HTMLInputElement.prototype) {
                                                    (e.target as HTMLInputElement).showPicker();
                                                }
                                            } catch (err) {}
                                        }}
                                        className={styles.input}
                                        style={{ padding: '0.25rem', width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}
                                    />
                                    {filters.plannedFinish && (
                                        <button onClick={() => setFilters(prev => ({ ...prev, plannedFinish: '' }))} className="btn btn-outline" style={{width: '100%', fontSize: '11px', padding: '4px'}}>
                                            Clear Filter
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.filterCard}>
                        <div className={styles.filterHeader} onClick={() => setIsPriorityExpanded(!isPriorityExpanded)}>
                            <div>
                                <div className={styles.filterTitle}>
                                    <Flag size={14} /> Priority
                                </div>
                                {!isPriorityExpanded && (
                                    <div className={styles.filterPreview}>
                                        {filters.priorities.length > 0 ? filters.priorities.join(', ') : 'Any priority'}
                                    </div>
                                )}
                            </div>
                            <ChevronRight size={16} style={{ transition: 'transform 0.2s', transform: isPriorityExpanded ? 'rotate(90deg)' : 'none', color: '#94a3b8' }} />
                        </div>
                        {isPriorityExpanded && (
                            <div className={styles.filterContent}>
                                <div className={styles.list}>
                                    {['Low', 'Normal', 'High', 'Urgent'].map(p => (
                                        <label key={p} className={styles.checkbox}>
                                            <input
                                                type="checkbox"
                                                checked={filters.priorities.includes(p)}
                                                onChange={() => togglePriority(p)}
                                            />
                                            {p}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <PriorityChart lanes={lanes} />



                </>
            )}
        </div>
    );
};

export default FilterSidebar;
