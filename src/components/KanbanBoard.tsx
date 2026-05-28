import React, { useState, useEffect, useRef } from 'react';
import { DndContext, DragOverlay, useSensors, useSensor, PointerSensor, DragStartEvent, DragEndEvent, DragOverEvent, closestCorners, rectIntersection, pointerWithin, CollisionDetection, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Lane, Card } from '../types';
import client from '../api/client';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import styles from './KanbanBoard.module.css';
import { calculatePriority } from '../utils/priorityEngine';

interface Props {
    filters?: {
        search: string;
        userIds: string[];
        priorities: string[];
    };
    onCardClick?: (card: Card) => void;
    lanes: Lane[];
    setLanes: React.Dispatch<React.SetStateAction<Lane[]>>;
}

const KanbanBoard: React.FC<Props> = ({ filters, onCardClick, lanes, setLanes }) => {
    const [activeCard, setActiveCard] = useState<Card | null>(null);
    const boardRef = useRef<HTMLDivElement>(null);
    const [isDraggingBoard, setIsDraggingBoard] = useState(false);
    const dragInfo = useRef({ isDown: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3, // Lower threshold for more responsive start
            },
        })
    );

    // Custom collision detection strategy for better precision
    const customCollisionDetection: CollisionDetection = (args) => {
        // pointerWithin is best for Kanban as it focuses on where the user is actually pointing
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) return pointerCollisions;
        
        // Fallback to rectIntersection for broader target areas
        const rectCollisions = rectIntersection(args);
        if (rectCollisions.length > 0) return rectCollisions;
        
        // Final fallback to closestCorners
        return closestCorners(args);
    };


    const findLane = (id: string) => {
        return lanes.find(l => l.id === id) || lanes.find(l => l.cards.some(c => c.id === id));
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const cardId = active.id as string;
        const lane = findLane(cardId);
        if (lane) {
            const card = lane.cards.find(c => c.id === cardId);
            if (card) setActiveCard(card);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;
        
        const activeId = active.id as string;
        const overId = over.id as string;
        
        if (activeId === overId) return;

        setLanes(prevLanes => {
            const activeLane = prevLanes.find(l => l.cards.some(c => c.id === activeId));
            const overLane = prevLanes.find(l => l.id === overId) || 
                             prevLanes.find(l => l.cards.some(c => c.id === overId));
            
            if (!activeLane || !overLane || activeLane.id === overLane.id) return prevLanes;

            const activeItems = activeLane.cards;
            const overItems = overLane.cards;
            const activeIndex = activeItems.findIndex(c => c.id === activeId);
            const overIndex = overItems.findIndex(c => c.id === overId);
            
            let newIndex;
            if (overId === overLane.id) {
                newIndex = overItems.length;
            } else {
                const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
            }
            
            const cardToMove = { ...activeItems[activeIndex], laneId: overLane.id };
            
            return prevLanes.map(lane => {
                if (lane.id === activeLane.id) {
                    return { ...lane, cards: lane.cards.filter(c => c.id !== activeId) };
                }
                if (lane.id === overLane.id) {
                    const newCards = [...lane.cards];
                    newCards.splice(newIndex, 0, cardToMove);
                    return { ...lane, cards: newCards };
                }
                return lane;
            });
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveCard(null);

        if (!over) return;
        
        const activeId = active.id as string;
        const overId = over.id as string;
        
        // Final state update for same-lane sorting
        setLanes(prevLanes => {
            const activeLane = prevLanes.find(l => l.cards.some(c => c.id === activeId));
            const overLane = prevLanes.find(l => l.id === overId) || 
                             prevLanes.find(l => l.cards.some(c => c.id === overId));
            
            if (activeLane && overLane && activeLane.id === overLane.id) {
                const activeIndex = activeLane.cards.findIndex(c => c.id === activeId);
                const overIndex = activeLane.cards.findIndex(c => c.id === overId);
                
                if (activeIndex !== overIndex) {
                    return prevLanes.map(lane => {
                        if (lane.id === activeLane.id) {
                            return { ...lane, cards: arrayMove(lane.cards, activeIndex, overIndex) };
                        }
                        return lane;
                    });
                }
            }
            return prevLanes;
        });

        // Persist to backend
        // Use lanes prop here as a baseline, or just re-find after state update?
        // Actually, we can just find it in the current state since this is async
        const finalLane = lanes.find(l => l.cards.some(c => c.id === activeId));
        if (finalLane) {
            try {
                await client.put(`/cards/${activeId}`, { laneId: finalLane.id });
            } catch (error) {
                console.error('Failed to move card', error);
                // Optionally re-fetch to sync if failed
            }
        }
    };

    // --- Board Multi-Directional Drag-to-Scroll Logic ---
    const onMouseDown = (e: React.MouseEvent) => {
        // Ignore clicks on buttons, inputs, or cards
        const target = e.target as HTMLElement;
        if (
            target.closest('button') || 
            target.closest('input') || 
            target.closest('textarea') || 
            target.closest('[data-kanban-card="true"]')
        ) {
            return;
        }

        // Check if we are inside a KanbanCard (using the actual card component class/id)
        // Since we are in the same project, we can check for common card selectors
        if (target.closest('[class*="card"]')) {
            // Check if it's actually our card by looking at its parent or structure
            // But usually, [class*="card"] is enough if we are careful
            // A better way: check if it's draggable by dnd-kit
            if (target.closest('[aria-roledescription="draggable"]')) return;
        }

        dragInfo.current = {
            isDown: true,
            startX: e.pageX - (boardRef.current?.offsetLeft || 0),
            startY: e.pageY - (boardRef.current?.offsetTop || 0),
            scrollLeft: boardRef.current?.scrollLeft || 0,
            scrollTop: boardRef.current?.scrollTop || 0
        };
        setIsDraggingBoard(true);
    };

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!dragInfo.current.isDown || !boardRef.current) return;
            
            const x = e.pageX - (boardRef.current.offsetLeft || 0);
            const y = e.pageY - (boardRef.current.offsetTop || 0);
            
            const walkX = (x - dragInfo.current.startX) * 1.5;
            const walkY = (y - dragInfo.current.startY) * 1.5;
            
            boardRef.current.scrollLeft = dragInfo.current.scrollLeft - walkX;
            boardRef.current.scrollTop = dragInfo.current.scrollTop - walkY;
        };

        const handleGlobalMouseUp = () => {
            dragInfo.current.isDown = false;
            setIsDraggingBoard(false);
        };

        if (isDraggingBoard) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDraggingBoard]);
    // ----------------------------------------------------

    const filteredLanes = lanes.map(lane => ({
        ...lane,
        cards: lane.cards.map(card => ({
            ...card,
            priority: calculatePriority(card, lane.title)
        })).filter(card => {
            if (filters?.search) {
                const term = filters.search.toLowerCase().trim();
                
                const searchFields = [
                    card.title,
                    card.headerId,
                    card.orderNumber,
                    card.status,
                    card.priority,
                    card.pickupDate,
                    card.plannedStart,
                    card.plannedFinish,
                    ...(card.assignedUsers?.map(u => u.name) || []),
                    ...(card.tags?.map(t => t.name) || [])
                ];

                const matches = searchFields.some(field => 
                    field && field.toString().toLowerCase().includes(term)
                );
                
                if (!matches) return false;
            }
            if (filters?.userIds && filters.userIds.length > 0) {
                const hasUser = card.assignedUsers.some(u => filters.userIds.includes(u.id));
                if (!hasUser) return false;
            }
            if (filters?.priorities && filters.priorities.length > 0) {
                if (!filters.priorities.includes(card.priority)) return false;
            }
            return true;
        })
    }));

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            autoScroll={{
                threshold: 50,
                acceleration: 10,
                canScroll: (element) => element === boardRef.current
            }}
        >
            <div 
                ref={boardRef}
                className={`${styles.board} ${isDraggingBoard ? styles.dragging : ''}`}
                onMouseDown={onMouseDown}
            >
                {filteredLanes.map(lane => (
                    <KanbanColumn key={lane.id} lane={lane} onCardClick={onCardClick} />
                ))}
            </div>
            <DragOverlay>
                {activeCard ? <KanbanCard card={activeCard} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
};

export default KanbanBoard;
