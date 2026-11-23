import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import FilterSidebar from '../components/FilterSidebar';
import KanbanBoard from '../components/KanbanBoard';
import NewClientModal from '../components/NewClientModal';
import CardDetailModal from '../components/CardDetailModal';
import TasksView from '../components/TasksView';
import UserManagementModal from '../components/UserManagementModal';
import KanbanInsightsPanel from '../components/KanbanInsightsPanel';
import DailyExecutionPlanner from '../components/DailyExecutionPlanner';
import SmartStartModal from '../components/SmartStartModal';
import ExecutiveDashboard from '../components/ExecutiveDashboard';
import FollowUpCenter from '../components/FollowUpCenter';
import { exportToExcel } from '../utils/excelExport';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { User, Card, Lane } from '../types';
import styles from './Board.module.css';

const Board = () => {
  const { user, isAdmin } = useAuth();
  const [view, setView] = useState('dashboard');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSmartStart, setShowSmartStart] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    userIds: [] as string[],
    priorities: [] as string[],
    plannedStart: '',
    plannedFinish: '',
  });

  const [users, setUsers] = useState<User[]>([]);
const [restoredForUser, setRestoredForUser] = useState<string | null>(null);


  useEffect(() => {
    fetchUsers();
    fetchLanes();
  }, []);

// Restore the user's board state after a page refresh
useEffect(() => {
    if (!user?.id) return;

    const storageKey = `plainview_board_state_v1_${user.id}`;

    try {
        const savedState = sessionStorage.getItem(storageKey);

        if (savedState) {
            const parsed = JSON.parse(savedState);

            if (parsed.filters && typeof parsed.filters === 'object') {
                setFilters(prev => ({
                    ...prev,
                    ...parsed.filters,
                    userIds: Array.isArray(parsed.filters.userIds)
                        ? parsed.filters.userIds
                        : [],
                    priorities: Array.isArray(parsed.filters.priorities)
                        ? parsed.filters.priorities
                        : [],
                }));
            }

            const validViews = [
                'dashboard',
                'tasks',
                'exec-dashboard',
                'planner',
                'followUps'
            ];

            if (
                validViews.includes(parsed.view) &&
                (parsed.view !== 'exec-dashboard' || isAdmin)
            ) {
                setView(parsed.view);
            }

            if (typeof parsed.showSidebar === 'boolean') {
                setShowSidebar(parsed.showSidebar);
            }
        }
    } catch (error) {
        console.error('Failed to restore board state:', error);
    }

    setRestoredForUser(user.id);
}, [user?.id, isAdmin]);

// Save the user's board state whenever filters or view settings change
useEffect(() => {
    if (!user?.id || restoredForUser !== user.id) return;

    const storageKey = `plainview_board_state_v1_${user.id}`;

    try {
        sessionStorage.setItem(storageKey, JSON.stringify({
            filters,
            view,
            showSidebar
        }));
    } catch (error) {
        console.error('Failed to save board state:', error);
    }
}, [filters, view, showSidebar, user?.id, restoredForUser]);


  useEffect(() => {
    if (user && lanes.length > 0) {
      const today = new Date().toDateString();
      const lastLoginKey = `lastLogin_${user.id}`;
      const lastLogin = localStorage.getItem(lastLoginKey);
      
      if (lastLogin !== today) {
        setShowSmartStart(true);
        localStorage.setItem(lastLoginKey, today);
      }
    }
  }, [user, lanes.length]);

  const fetchUsers = async () => {
    try {
      const res = await client.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLanes = async () => {
    try {
      const res = await client.get('/lanes');
      setLanes(res.data);
    } catch (error) {
      console.error('Failed to fetch lanes', error);
    }
  };

  const handleRefresh = () => {
    fetchLanes();
    setRefreshKey(prev => prev + 1);
  };

  const handleCardClick = (card: Card | any) => {
    setSelectedCard(card);
  };

  const handleUpdateCard = (updatedCard?: Card) => {
    if (updatedCard) {
      // In-memory update
      setLanes(prevLanes => prevLanes.map(lane => ({
        ...lane,
        cards: lane.cards.map(c => c.id === updatedCard.id ? updatedCard : c)
      })));
    } else {
      // Fallback to full refresh
      fetchLanes();
    }
  };

  const handleOpenCardFromId = (cardId: string) => {
    // Search all lanes
    let foundCard = null;
    for (const lane of lanes) {
      const card = lane.cards.find(c => c.id === cardId);
      if (card) {
        foundCard = card;
        break;
      }
    }

    if (foundCard) {
      // Navigate to board dashboard if not already there
      setView('dashboard');
      
      // Select it to open the modal
      setSelectedCard(foundCard);

      // Scroll to it on the board
      setTimeout(() => {
        const el = document.getElementById(`card-${cardId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Optional: Add a temporary pulse or outline
          const originalOutline = el.style.outline;
          const originalTransition = el.style.transition;
          el.style.transition = 'outline 0.3s ease';
          el.style.outline = '3px solid #3b82f6';
          setTimeout(() => {
            el.style.outline = originalOutline;
            setTimeout(() => { el.style.transition = originalTransition; }, 300);
          }, 2000);
        }
      }, 100);

    } else {
      alert("Card not found. It may have been deleted.");
    }
  };

  const handleResolveTask = async (taskId: string) => {
    let currentLane: Lane | undefined;
    let targetCard: Card | undefined;
    
    for (const lane of lanes) {
        const card = lane.cards.find(c => c.id === taskId);
        if (card) {
            currentLane = lane;
            targetCard = card;
            break;
        }
    }

    if (!currentLane || !targetCard) return;

    const sortedLanes = [...lanes].sort((a, b) => a.order - b.order);
    const currentIndex = sortedLanes.findIndex(l => l.id === currentLane!.id);
    
    let targetLane: Lane | undefined;
    if (currentIndex !== -1 && currentIndex < sortedLanes.length - 1) {
        targetLane = sortedLanes[currentIndex + 1];
    }

    if (!targetLane) {
        console.error("Next lane not found for progression");
        return;
    }

    // Optimistic update
    setLanes(prevLanes => {
        return prevLanes.map(lane => {
            if (lane.id === currentLane!.id) {
                // Remove from current lane if moving
                return targetLane ? { ...lane, cards: lane.cards.filter(c => c.id !== taskId) } : lane;
            }
            if (targetLane && lane.id === targetLane.id) {
                // Add to new lane
                return { ...lane, cards: [...lane.cards, { ...targetCard!, laneId: targetLane.id, status: 'Unblocked' }] };
            }
            return lane;
        });
    });

    try {
        if (targetLane) {
            await client.put(`/cards/${taskId}`, { laneId: targetLane.id, status: 'Unblocked' });
        }
    } catch (error) {
        console.error("Failed to auto-advance task", error);
        fetchLanes(); // Revert on failure
    }
  };

  const handleCreateLane = async () => {
    if (!isAdmin) return;

    const title = window.prompt('Enter the new column name:');
    if (!title || !title.trim()) return;

    try {
      const res = await client.post('/lanes', {
        title: title.trim()
      });

      setLanes(prev => [...prev, res.data].sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Failed to create column:', error);
      alert('Could not create the column. Please try again.');
    }
  };

  const handleRenameLane = async (lane: Lane) => {
    if (!isAdmin) return;

    const title = window.prompt('Enter the new column name:', lane.title);
    if (!title || !title.trim() || title.trim() === lane.title) return;

    try {
      const res = await client.put(`/lanes/${lane.id}`, {
        title: title.trim()
      });

      setLanes(prev => prev.map(item =>
        item.id === lane.id
          ? { ...item, title: res.data.title }
          : item
      ));
    } catch (error) {
      console.error('Failed to rename column:', error);
      alert('Could not rename the column. Please try again.');
    }
  };

  const handleDeleteLane = async (lane: Lane) => {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${lane.title}"?`
    );

    if (!confirmed) return;

    try {
      await client.delete(`/lanes/${lane.id}`);
      setLanes(prev => prev.filter(item => item.id !== lane.id));
    } catch (error: any) {
      console.error('Failed to delete column:', error);
      alert(
        error.response?.data?.error ||
        'Could not delete the column. Please try again.'
      );
    }
  };

  const handleExport = () => {
    exportToExcel();
  };

  return (
    <div className={styles.layout}>
      <TopBar
        onNewClient={() => setShowNewClientModal(true)}
        onExport={handleExport}
        onManageUsers={() => setShowUserManagement(true)}
        onShowTasks={() => setView('tasks')}
        onShowDashboard={() => setView('exec-dashboard')}
        onShowPlanner={() => setView('planner')}
        onShowFollowUps={() => setView('followUps')}
        onOpenCard={handleOpenCardFromId}
        lanes={lanes}
      />

      {view === 'dashboard' ? (
        <div className={styles.main}>
          <FilterSidebar
            isOpen={showSidebar}
            filters={filters}
            setFilters={setFilters}
            users={users}
            lanes={lanes}
            onToggleSidebar={() => setShowSidebar(prev => !prev)}
          />

          <div className={styles.boardContainer}>
            <KanbanBoard
  key={refreshKey}
  filters={filters}
  onCardClick={handleCardClick}
  lanes={lanes}
  setLanes={setLanes}
  isAdmin={isAdmin}
  onAddColumn={handleCreateLane}
  onRenameLane={handleRenameLane}
  onDeleteLane={handleDeleteLane}
/>
            <KanbanInsightsPanel lanes={lanes} />
          </div>
        </div>
      ) : view === 'tasks' ? (
        <div className={styles.main}>
          <TasksView onBack={() => setView('dashboard')} />
        </div>
      ) : view === 'exec-dashboard' && isAdmin ? (
        <div className={styles.main}>
          <ExecutiveDashboard lanes={lanes} onBack={() => setView('dashboard')} />
        </div>
      ) : view === 'followUps' ? (
        <div className={styles.main}>
          <FollowUpCenter lanes={lanes} onBack={() => setView('dashboard')} onRefresh={handleRefresh} />
        </div>
      ) : (
        <div className={styles.main}>
          <DailyExecutionPlanner 
            lanes={lanes} 
            currentUser={user} 
            onBack={() => setView('dashboard')} 
            onResolveTask={handleResolveTask}
          />
        </div>
      )}

      {showNewClientModal && isAdmin && (
        <NewClientModal
          onClose={() => setShowNewClientModal(false)}
          onSuccess={handleRefresh}
        />
      )}

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleUpdateCard}
        />
      )}

      {showUserManagement && (
        <UserManagementModal
          onClose={() => setShowUserManagement(false)}
        />
      )}

      {showSmartStart && user && (
        <SmartStartModal
          user={user}
          lanes={lanes}
          onClose={() => setShowSmartStart(false)}
          onStartDay={() => {
            setShowSmartStart(false);
            setView('planner');
          }}
        />
      )}
    </div>
  );
};

export default Board;