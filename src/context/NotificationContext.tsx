import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useAuth } from './AuthContext';

export interface Notification {
    id: string;
    userId: string;
    senderName: string;
    cardId: string;
    cardTitle: string;
    read: boolean;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            return;
        }
        try {
            const res = await client.get('/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
        // Polling every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        try {
            await client.put(`/notifications/${id}/read`);
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
            fetchNotifications();
        }
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        try {
            await client.put('/notifications/read-all');
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
            fetchNotifications();
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
