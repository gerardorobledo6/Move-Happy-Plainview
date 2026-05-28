import React, { useState, useRef, useEffect } from 'react';
import client from '../api/client';
import { Card, Comment, User } from '../types';
import styles from './CardDetailModal.module.css';
import { format } from 'date-fns';
import { X, Save, Plus } from 'lucide-react';

interface Props {
    card: Card;
    onClose: () => void;
    onUpdate: (updatedCard?: Card) => void; // 🔥 IMPORTANTE: ahora puede recibir data
}

const CardDetailModal: React.FC<Props> = ({ card, onClose, onUpdate }) => {
    const [title, setTitle] = useState(card.title);
    const [orderNumber, setOrderNumber] = useState(card.orderNumber || '');
    const [description, setDescription] = useState(card.description || '');
    const [pickupDate, setPickupDate] = useState(
        card.pickupDate ? new Date(card.pickupDate).toISOString().split('T')[0] : ''
    );
    const [plannedStart, setPlannedStart] = useState(
        card.plannedStart ? new Date(card.plannedStart).toISOString().split('T')[0] : ''
    );
    const [plannedFinish, setPlannedFinish] = useState(
        card.plannedFinish ? new Date(card.plannedFinish).toISOString().split('T')[0] : ''
    );
    const [assignedUserId, setAssignedUserId] = useState(
        card.assignedUsers && card.assignedUsers.length > 0 ? card.assignedUsers[0].id : ''
    );
    const [allUsers, setAllUsers] = useState<User[]>([]);

    const [loading, setLoading] = useState(false);

    // Fetch all users on mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await client.get('/users');
                setAllUsers(res.data);
            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        };
        fetchUsers();
    }, []);

    // Auto-resize description logic
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
        if (descriptionRef.current) {
            descriptionRef.current.style.height = '70px';
            descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
        }
    }, [description]);

    // New Task Modal state
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('Normal');



    const handleSaveDetails = async () => {
        try {
            setLoading(true);

            // 1. Construct explicit payload with all required fields
            const payload = {
                title,
                orderNumber,
                description,
                plannedStart: plannedStart || null,
                plannedFinish: plannedFinish || null,
                pickupDate: pickupDate || null,
                assignedUserIds: assignedUserId ? [assignedUserId] : [],
            };

            // 2. Perform API call
            const res = await client.put(`/cards/${card.id}`, payload);

            // 3. Validate and use response
            if (res.data) {
                console.log("Card details saved successfully:", res.data);
                
                // 4. Update parent state and close modal
                onUpdate(res.data);
                onClose();
            } else {
                throw new Error("Server returned an empty response");
            }

        } catch (error: any) {
            // 5. Detailed error logging for debugging
            const errorMessage = error.response?.data?.error || error.message || "Unknown error";
            console.error("Failed to save card details:", {
                message: errorMessage,
                status: error.response?.status,
                payload: { title, orderNumber, description, plannedStart, plannedFinish }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = () => {
        if (!newTaskName.trim()) return;

        let tasks: any[] = [];
        try {
            const storedTasks = localStorage.getItem("tasks");
            if (storedTasks) {
                tasks = JSON.parse(storedTasks);
            }
        } catch (e) {
            console.error("Failed to parse tasks from localStorage", e);
        }

        const assignee = allUsers.find(u => u.id === newTaskAssignee);
        const assigneeId = assignee ? assignee.id : null;

        const newTask = {
            id: Date.now().toString(),
            cardId: card.id,
            assigneeId,
            taskName: newTaskName.trim(),
            priority: newTaskPriority,
            status: "Pending",
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);

        try {
            localStorage.setItem("tasks", JSON.stringify(tasks));
        } catch (e) {
            console.error("Failed to save tasks to localStorage", e);
        }

        setNewTaskName('');
        setNewTaskAssignee('');
        setNewTaskPriority('Normal');
        setIsNewTaskModalOpen(false);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <span>{card.headerId}</span>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.mainArea}>
                    <div className={styles.twoColumn}>
                        {/* LEFT SIDE: Title, Tags and Description */}
                        <div className={styles.leftSide}>
                            <div className={styles.titleSection}>
                                <label className={styles.sectionLabel}>Title</label>
                                <input
                                    className={styles.titleInput}
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Enter card title..."
                                />
                            </div>

                            <div className={styles.section}>
                                <label className={styles.sectionLabel}>Pickup Date</label>
                                <div className={styles.dateField}>
                                    <input
                                        type="date"
                                        value={pickupDate}
                                        onChange={e => setPickupDate(e.target.value)}
                                        onClick={(e) => (e.target as any).showPicker?.()}
                                    />
                                </div>
                            </div>

                            <div className={styles.section}>
                                <label className={styles.sectionLabel}>Description</label>
                                <textarea
                                    ref={descriptionRef}
                                    className={styles.descriptionText}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Add a description..."
                                    rows={1}
                                />
                            </div>

                            <button 
                                className={`${styles.newTaskBtn} btn btn-secondary`}
                                onClick={() => setIsNewTaskModalOpen(true)}
                            >
                                <Plus size={16} />
                                New Task
                            </button>
                        </div>

                        {/* RIGHT SIDE: Users, Dates, Order Number + Save Button */}
                        <div className={styles.rightSide}>
                            <div className={styles.rightContent}>
                                <div className={styles.section}>
                                    <label className={styles.sectionLabel}>Assignee</label>
                                    <select
                                        className={styles.assigneeSelect}
                                        value={assignedUserId}
                                        onChange={e => setAssignedUserId(e.target.value)}
                                    >
                                        <option value="">Unassigned</option>
                                        {allUsers.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.section}>
                                    <label className={styles.sectionLabel}>Planned Dates</label>
                                    <div className={styles.dateGrid}>
                                        <div className={styles.dateField}>
                                            <label>Start</label>
                                            <input
                                                type="date"
                                                value={plannedStart}
                                                onChange={e => setPlannedStart(e.target.value)}
                                                onClick={(e) => (e.target as any).showPicker?.()}
                                            />
                                        </div>
                                        <div className={styles.dateField}>
                                            <label>Finish</label>
                                            <input
                                                type="date"
                                                value={plannedFinish}
                                                onChange={e => setPlannedFinish(e.target.value)}
                                                onClick={(e) => (e.target as any).showPicker?.()}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.section}>
                                    <label className={styles.sectionLabel}>Order Number</label>
                                    <input
                                        className={styles.orderNumberInput}
                                        value={orderNumber}
                                        onChange={e => setOrderNumber(e.target.value)}
                                        placeholder="Order Number"
                                    />
                                </div>
                            </div>

                            <div className={styles.footer}>
                                <button
                                    className={`${styles.saveBtn} btn btn-primary`}
                                    onClick={handleSaveDetails}
                                    disabled={loading}
                                >
                                    <Save size={16} />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* NEW TASK SUB-MODAL */}
            {isNewTaskModalOpen && (
                <div className={styles.subOverlay}>
                    <div className={styles.subModal}>
                        <div className={styles.subHeader}>
                            <h3>Create New Task</h3>
                            <button onClick={() => setIsNewTaskModalOpen(false)} className={styles.closeBtn}>
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className={styles.subBody}>
                            <div className={styles.subField}>
                                <label>Task Name</label>
                                <input 
                                    type="text" 
                                    placeholder="What needs to be done?"
                                    value={newTaskName}
                                    onChange={(e) => setNewTaskName(e.target.value)}
                                />
                            </div>

                            <div className={styles.subField}>
                                <label>Assignee</label>
                                <select 
                                    value={newTaskAssignee}
                                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                                >
                                    <option value="">Select Assignee...</option>
                                    {allUsers.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.subField}>
                                <label>Priority</label>
                                <select
                                    value={newTaskPriority}
                                    onChange={(e) => setNewTaskPriority(e.target.value)}
                                >
                                    <option value="Normal">Normal</option>
                                    <option value="Critical">Critical</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.subFooter}>
                            <button 
                                className={`${styles.cancelBtn} btn btn-outline`} 
                                onClick={() => setIsNewTaskModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className={`${styles.createTaskBtn} btn btn-primary`}
                                onClick={handleCreateTask}
                            >
                                Create Task
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CardDetailModal;