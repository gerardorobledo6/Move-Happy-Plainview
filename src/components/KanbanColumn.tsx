import React, { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Lane, Card } from '../types';
import KanbanCard from './KanbanCard';
import styles from './KanbanColumn.module.css';
import { Plus, Minus } from 'lucide-react';

interface Props {
    lane: Lane;
    onCardClick?: (card: Card) => void;
}

const KanbanColumn: React.FC<Props> = ({ lane, onCardClick }) => {
    // Persistent state using localStorage
    const storageKey = `kanban-column-collapsed-${lane.id}`;
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem(storageKey, isCollapsed.toString());
    }, [isCollapsed, storageKey]);

    const { setNodeRef, isOver } = useDroppable({
        id: lane.id,
        disabled: isCollapsed,
        data: {
            type: 'COLUMN',
            lane
        }
    });

    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    // Color mapping for a modern ClickUp feel
    const getLaneColor = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('welcome') || t.includes('backlog')) return '#94a3b8'; // Slate
        if (t.includes('prep') || t.includes('ready')) return '#60a5fa'; // Blue
        if (t.includes('live') || t.includes('active')) return '#f59e0b'; // Amber
        if (t.includes('finished') || t.includes('done')) return '#10b981'; // Emerald
        if (t.includes('claim') || t.includes('issue')) return '#ef4444'; // Red
        return '#d1d5db'; // Default gray
    };

    const color = getLaneColor(lane.title);

    return (
        <div className={`${styles.column} ${isCollapsed ? styles.collapsed : ''} ${isOver ? styles.isOver : ''}`}>
            <div className={styles.idBar} style={{ backgroundColor: color }} />
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <button 
                        className={styles.toggleBtn} 
                        onClick={toggleCollapse}
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        {isCollapsed ? <Plus size={14} /> : <Minus size={14} />}
                    </button>
                    <span>{lane.title}</span>
                </div>
                <span className={styles.count}>{lane.cards.length}</span>
            </div>
            <div ref={setNodeRef} className={styles.cardList}>
                <SortableContext items={lane.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {lane.cards.map(card => (
                        <KanbanCard key={card.id} card={card} onClick={onCardClick} />
                    ))}
                </SortableContext>
                {lane.cards.length === 0 && <div className={styles.placeholder}>Drop here</div>}
            </div>
        </div>
    );
};

export default KanbanColumn;
