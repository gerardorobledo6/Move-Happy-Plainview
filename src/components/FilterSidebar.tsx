import styles from './FilterSidebar.module.css';
import { User, Lane } from '../types';

import { ChevronRight, Search, PanelLeft } from 'lucide-react';
import { useState } from 'react';
import PriorityChart from './PriorityChart';

interface FilterState {
    search: string;
    userIds: string[];
    priorities: string[];
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
                    <div className={styles.section}>
                        <h3 onClick={() => setIsUsersExpanded(!isUsersExpanded)} className={styles.collapsibleHeader}>
                            <ChevronRight size={14} className={`${styles.chevron} ${isUsersExpanded ? styles.expanded : ''}`} />
                            Assigned User
                        </h3>
                        {isUsersExpanded && (
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
                        )}
                    </div>

                    <div className={styles.section}>
                        <h3 onClick={() => setIsPriorityExpanded(!isPriorityExpanded)} className={styles.collapsibleHeader}>
                            <ChevronRight size={14} className={`${styles.chevron} ${isPriorityExpanded ? styles.expanded : ''}`} />
                            Priority
                        </h3>
                        {isPriorityExpanded && (
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
                        )}
                    </div>

                    <PriorityChart lanes={lanes} />



                </>
            )}
        </div>
    );
};

export default FilterSidebar;
