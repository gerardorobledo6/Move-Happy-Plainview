import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { User } from '../types';
import styles from './UserManagementModal.module.css';
import { X, Plus, Trash, Edit, Save } from 'lucide-react';

interface Props {
    onClose: () => void;
}

const UserManagementModal: React.FC<Props> = ({ onClose }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER',
        avatarColor: '#3b82f6'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await client.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const handleCreate = () => {
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'USER',
            avatarColor: '#3b82f6'
        });
        setIsCreating(true);
    };

    const handleEdit = (user: User) => {
        setIsCreating(false);
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Don't show password
            role: user.role,
            avatarColor: user.avatarColor || '#3b82f6'
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isCreating) {
                await client.post('/users', formData);
            } else if (editingUser && editingUser.id) {
                await client.put(`/users/${editingUser.id}`, formData);
            }
            setIsCreating(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Failed to save user', error);
            alert('Failed to save user');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await client.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert('Failed to delete user');
        }
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>User Management</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={24} /></button>
                </div>

                <div className={styles.content}>
                    <div className={styles.listSection}>
                        <div className={styles.listHeader}>
                            <h3>Users ({users.length})</h3>
                            <button onClick={handleCreate} className={`${styles.createBtn} btn btn-primary`}><Plus size={16} /> Add User</button>
                        </div>
                        <div className={styles.userList}>
                            {users.map(user => (
                                <div key={user.id} className={styles.userRow}>
                                    <div className={styles.userInfo}>
                                        <div className={styles.avatar} style={{ backgroundColor: user.avatarColor }}>
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className={styles.userDetails}>
                                            <span className={styles.userName}>{user.name}</span>
                                            <span className={styles.userEmail}>{user.email} - {user.role}</span>
                                        </div>
                                    </div>
                                    <div className={styles.actions}>
                                        <button onClick={() => handleEdit(user)} className={`${styles.iconBtn} btn btn-outline`} style={{ padding: '0.25rem' }}><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(user.id)} className={`${styles.iconBtn} btn btn-outline`} style={{ color: '#ef4444', padding: '0.25rem' }}><Trash size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {(isCreating || editingUser) && (
                        <div className={styles.formSection}>
                            <h3>{isCreating ? 'Create User' : 'Edit User'}</h3>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.group}>
                                    <label>Name</label>
                                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className={styles.group}>
                                    <label>Email</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div className={styles.group}>
                                    <label>Password {editingUser && '(Leave blank to keep same)'}</label>
                                    <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={isCreating} />
                                </div>
                                <div className={styles.group}>
                                    <label>Role</label>
                                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="USER">User</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div className={styles.group}>
                                    <label>Avatar Color</label>
                                    <input type="color" value={formData.avatarColor} onChange={e => setFormData({ ...formData, avatarColor: e.target.value })} />
                                </div>
                                <div className={styles.formActions}>
                                    <button type="button" onClick={() => { setIsCreating(false); setEditingUser(null); }} className={`${styles.cancelBtn} btn btn-outline`}>Cancel</button>
                                    <button type="submit" className={`${styles.saveBtn} btn btn-primary`}><Save size={16} /> Save</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagementModal;
