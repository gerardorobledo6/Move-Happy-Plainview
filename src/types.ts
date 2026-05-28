export interface User {
    id: string;
    email: string;
    name: string;
    avatarColor: string;
    role: 'ADMIN' | 'USER';
}

export interface Tag {
    id: string;
    name: string;
    color: string;
}

export interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: User;
}

export interface FollowUp {
    id: string;
    cardId: string;
    lastFollowUpDate: string;
    nextFollowUpDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface Card {
    id: string;
    title: string;
    headerId: string;
    description?: string;
    plannedStart?: string;
    plannedFinish?: string;
    priority: 'Low' | 'Normal' | 'High' | 'Urgent';
    status: 'Blocked' | 'Unblocked';
    laneId: string;
    assignedUsers: User[];
    tags: Tag[];
    comments: Comment[];
    externalLink?: string;
    orderNumber?: string;
    pickupDate?: string;
    resolvedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    followUp?: FollowUp | null;
}

export interface Lane {
    id: string;
    title: string;
    order: number;
    type: string;
    cards: Card[];
}
