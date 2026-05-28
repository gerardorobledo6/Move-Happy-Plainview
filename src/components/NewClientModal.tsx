import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { User } from '../types';
import styles from './NewClientModal.module.css';
import { X } from 'lucide-react';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

const NewClientModal: React.FC<Props> = ({ onClose, onSuccess }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        pickupDate: '',
        orderNumber: '',
        status: 'Unblocked',
        plannedStart: '',
        plannedFinish: '',
        laneId: '', // Will default to first lane
        assignedUserIds: [] as string[],
        tags: '',
        externalLink: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, lanesRes] = await Promise.all([
                    client.get('/users'),
                    client.get('/lanes')
                ]);
                setUsers(usersRes.data);
                if (lanesRes.data.length > 0) {
                    setFormData(prev => ({ ...prev, laneId: lanesRes.data[0].id }));
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await client.post('/cards', formData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create card', error);
            alert('Failed to create card');
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>New Client</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.group}>
                        <label>Client Name (Title)</label>
                        <input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="e.g. Client A - Project X"
                        />
                    </div>

                    <div className={styles.group}>
                        <label>Pickup Date</label>
                        <input
                            type="date"
                            value={formData.pickupDate}
                            onChange={e => setFormData({ ...formData, pickupDate: e.target.value })}
                            required
                            onClick={(e) => (e.target as any).showPicker?.()}
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.group}>
                            <label>Order Number</label>
                            <input
                                type="text"
                                value={formData.orderNumber}
                                onChange={e => setFormData({ ...formData, orderNumber: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.group}>
                            <label>Assigned User</label>
                            <select
                                onChange={e => setFormData({ ...formData, assignedUserIds: e.target.value ? [e.target.value] : [] })}
                            >
                                <option value="">Unassigned</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.group}>
                            <label>Planned Start</label>
                            <input
                                type="date"
                                value={formData.plannedStart}
                                onChange={e => setFormData({ ...formData, plannedStart: e.target.value })}
                                onClick={(e) => (e.target as any).showPicker?.()}
                            />
                        </div>
                        <div className={styles.group}>
                            <label>Planned Finish</label>
                            <input
                                type="date"
                                value={formData.plannedFinish}
                                onChange={e => setFormData({ ...formData, plannedFinish: e.target.value })}
                                onClick={(e) => (e.target as any).showPicker?.()}
                            />
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={`${styles.cancelBtn} btn btn-outline`}>Cancel</button>
                        <button type="submit" className={`${styles.submitBtn} btn btn-primary`}>Create Client</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewClientModal;
