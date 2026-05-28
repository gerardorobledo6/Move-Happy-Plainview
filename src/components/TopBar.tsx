import React from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../constants';
import styles from './TopBar.module.css';
import { Plus, UserPlus, FileSpreadsheet, LayoutDashboard, Sparkles, Bell, Users, ListFilter } from 'lucide-react';

import { Lane } from '../types';
import ProductivityScore from './ProductivityScore';

interface TopBarProps {
    onNewClient: () => void;
    onExport: () => void;
    onManageUsers?: () => void;
    onShowTasks?: () => void;
    onShowPlanner?: () => void;
    onShowDashboard?: () => void;
    onShowFollowUps?: () => void;
    lanes: Lane[];
}

const TopBar: React.FC<TopBarProps> = ({ 
    onNewClient, 
    onExport, 
    onManageUsers, 
    onShowTasks, 
    onShowPlanner,
    onShowDashboard,
    onShowFollowUps,
    lanes
}) => {
    const { user, logout, isAdmin } = useAuth();

    const allCards = React.useMemo(() => 
        lanes.flatMap(lane => lane.cards), 
        [lanes]
    );

    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <div className={styles.topbar}>
            <div className={styles.left}>
                <div className={styles.logo}>{APP_NAME}</div>
                <button onClick={onShowPlanner} className={`${styles.actionBtn} btn btn-primary`} style={{ backgroundColor: '#f59e0b' }}>
                    <Sparkles size={16} /> My Day
                </button>
                <button onClick={onShowFollowUps} className={`${styles.actionBtn} btn btn-primary`} style={{ backgroundColor: '#02457A' }}>
                    <Bell size={16} /> Follow-Ups
                </button>
                <button onClick={onShowTasks} className={`${styles.actionBtn} btn btn-primary`}>
                    <ListFilter size={16} /> Tasks
                </button>
                {isAdmin && (
                    <button onClick={onShowDashboard} className={`${styles.actionBtn} btn btn-primary`} style={{ backgroundColor: '#8b5cf6' }}>
                        <LayoutDashboard size={16} /> Dashboard
                    </button>
                )}
                {isAdmin && (
                    <button onClick={onNewClient} className={`${styles.actionBtn} btn btn-primary`}>
                        <Plus size={16} /> New Client
                    </button>
                )}
                {isAdmin && (
                    <button onClick={onExport} className={`${styles.actionBtn} btn btn-primary`} style={{ marginLeft: '0.5rem', backgroundColor: '#10b981' }}>
                        <FileSpreadsheet size={16} /> Export to Excel
                    </button>
                )}
                {isAdmin && (
                    <button onClick={onManageUsers} className={`${styles.actionBtn} btn btn-primary`} style={{ marginLeft: '0.5rem', backgroundColor: '#6366f1' }}>
                        <Users size={16} /> Manage Users
                    </button>
                )}
            </div>

            <div className={styles.right}>
                {user && <ProductivityScore cards={allCards} userId={user.id} />}
                <div className={styles.profileWrapper} ref={dropdownRef}>
                    <button 
                        className={styles.userProfileBtn} 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        type="button"
                    >
                        <div 
                            className={styles.avatar} 
                            style={{ 
                                backgroundColor: user?.avatarColor || '#3b82f6',
                                transform: isDropdownOpen ? 'scale(0.95)' : 'scale(1)'
                            }}
                        >
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <span>{user?.name}</span>
                    </button>

                    {isDropdownOpen && (
                        <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.dropdownHeader}>Notifications</div>
                            <div className={styles.dropdownList}>
                                <div className={styles.dropdownEmpty}>
                                    • No notifications
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={logout} className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}>Logout</button>
            </div>
        </div>
    );
};

export default TopBar;
