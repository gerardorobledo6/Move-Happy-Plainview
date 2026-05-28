import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../types';
import styles from './KanbanCard.module.css';
import { Calendar, AlignLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
    card: Card;
    isOverlay?: boolean;
    onClick?: (card: Card) => void;
}

const KanbanCard: React.FC<Props> = ({ card, isOverlay, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: card.id,
        disabled: isOverlay, // Disable sortable logic for the overlay instance
        data: {
            type: 'TASK',
            card
        }
    });

    const style = {
        transform: isOverlay ? undefined : CSS.Translate.toString(transform),
        transition: isOverlay ? undefined : transition,
        opacity: isDragging ? 0.25 : 1, // Clear placeholder look
    };

    const priorityColor = {
        'Low': '#10b981', // green
        'Normal': '#f59e0b', // yellow/orange
        'High': '#ef4444', // red
        'Urgent': '#7f1d1d' // dark red
    }[card.priority] || '#9ca3af';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            data-kanban-card="true"
            className={`${styles.card} ${isOverlay ? styles.overlay : ''} ${isDragging ? styles.dragging : ''}`}
            onClick={() => onClick?.(card)}
        >
            <div className={styles.priorityBar} style={{ backgroundColor: priorityColor }} />
            
            {card.orderNumber && (
                <div className={styles.ribbon}>
                    <div className={styles.orderNumber}>{card.orderNumber}</div>
                    {card.assignedUsers && card.assignedUsers.length > 0 && (
                        <div className={styles.avatar} style={{ backgroundColor: card.assignedUsers[0].avatarColor || '#d1d5db' }}>
                            {card.assignedUsers[0].name.charAt(0)}
                        </div>
                    )}
                </div>
            )}

            <div className={styles.content}>
                <div className={styles.title}>{card.title}</div>

                <div className={styles.footer}>
                    {card.plannedFinish && (
                        <div className={styles.date}>
                            <Calendar size={12} />
                            <span>{format(new Date(card.plannedFinish), 'MMM d')}</span>
                        </div>
                    )}
                    {card.description && <AlignLeft size={12} color="#9ca3af" />}
                </div>
            </div>
            {card.priority && (
                <div className={`${styles.priorityBadge} ${styles[card.priority.toLowerCase()] || styles.normal}`}>
                    {card.priority}
                </div>
            )}
        </div>
    );
};

export default KanbanCard;
