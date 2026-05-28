import { Card } from '../types';

export interface RiskForecast {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    predictedUrgencyInDays: number;
    explanation: string;
}

export interface AIAction {
    type: 'CALL' | 'FOLLOW_UP' | 'RISK_MITIGATION' | 'URGENT_MOVE';
    cardId: string;
    cardTitle: string;
    reason: string;
    priority: number; // 1 (highest) to 10
}

export interface FollowUpAction {
    cardId: string;
    cardTitle: string;
    reason: string;
    daysSinceLastActivity: number;
    priority: 'low' | 'medium' | 'high';
}

export function calculateRiskForecast(card: Card, laneTitle: string): RiskForecast | null {
    const now = new Date();
    const column = laneTitle.toLowerCase().replace(/\s/g, '');

    let predictedUrgencyInDays = 999;
    let explanation = '';

    switch (column) {
        case "welcome": {
            if (!card.plannedStart) return null;
            const start = new Date(card.plannedStart);
            const daysElapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
            // Urgent triggers at > 5 days.
            predictedUrgencyInDays = 5 - daysElapsed;
            if (predictedUrgencyInDays < 0) predictedUrgencyInDays = 0;
            break;
        }

        case "prep": {
            if (!card.pickupDate) return null;
            const pickup = new Date(card.pickupDate);
            const daysToPickup = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            // Urgent triggers at < 5 days.
            predictedUrgencyInDays = daysToPickup - 5;
            if (predictedUrgencyInDays < 0) predictedUrgencyInDays = 0;
            break;
        }

        case "premove": {
            if (!card.pickupDate) return null;
            const pickup = new Date(card.pickupDate);
            const daysToPickup = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            // Urgent triggers at <= 1 day.
            predictedUrgencyInDays = daysToPickup - 1;
            if (predictedUrgencyInDays < 0) predictedUrgencyInDays = 0;
            break;
        }

        case "pulive": {
            if (!card.pickupDate) return null;
            const pickup = new Date(card.pickupDate);
            const daysElapsed = (now.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24);
            // Urgent triggers at > 5 days elapsed
            predictedUrgencyInDays = 5 - daysElapsed;
            if (predictedUrgencyInDays < 0) predictedUrgencyInDays = 0;
            break;
        }

        default:
            return null;
    }

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (predictedUrgencyInDays === 0) {
        riskLevel = 'critical';
        explanation = 'Task is currently urgent or will become urgent today.';
    } else if (predictedUrgencyInDays <= 2) {
        riskLevel = 'high';
        explanation = `High risk of delay. Task becomes urgent in ${Math.ceil(predictedUrgencyInDays)} days.`;
    } else if (predictedUrgencyInDays <= 4) {
        riskLevel = 'medium';
        explanation = `Monitor closely. Task becomes urgent in ${Math.ceil(predictedUrgencyInDays)} days.`;
    } else {
        riskLevel = 'low';
        explanation = `Healthy trajectory. ${Math.ceil(predictedUrgencyInDays)} days until urgency threshold.`;
    }

    return {
        riskLevel,
        predictedUrgencyInDays,
        explanation
    };
}

export function generateAIActions(card: Card, laneTitle: string, risk: RiskForecast | null): AIAction[] {
    const actions: AIAction[] = [];
    const column = laneTitle.toLowerCase().replace(/\s/g, '');
    const now = new Date();

    // 1. RISK MITIGATION
    if (risk && (risk.riskLevel === 'critical' || risk.riskLevel === 'high')) {
        actions.push({
            type: 'RISK_MITIGATION',
            cardId: card.id,
            cardTitle: card.title,
            reason: `Potential delay detected: ${risk.explanation}`,
            priority: risk.riskLevel === 'critical' ? 1 : 2
        });
    }

    // 2. CALL ACTIONS (Urgent Prep or Premove)
    if (column === 'prep' || column === 'premove') {
        if (card.pickupDate) {
            const pickup = new Date(card.pickupDate);
            const daysToPickup = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysToPickup <= 2) {
                actions.push({
                    type: 'CALL',
                    cardId: card.id,
                    cardTitle: card.title,
                    reason: `Call client for final pickup confirmation (${Math.ceil(daysToPickup)} days left)`,
                    priority: daysToPickup <= 1 ? 1 : 3
                });
            }
        }
    }

    // 3. FOLLOW UP ACTIONS (Blocked or Long time in Welcome)
    if (card.status === 'Blocked') {
        actions.push({
            type: 'FOLLOW_UP',
            cardId: card.id,
            cardTitle: card.title,
            reason: 'Task is blocked - contact client or stakeholder to resolve bottleneck',
            priority: 4
        });
    }

    if (column === 'welcome') {
        if (card.plannedStart) {
            const start = new Date(card.plannedStart);
            const daysSinceStart = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceStart > 3) {
                actions.push({
                    type: 'FOLLOW_UP',
                    cardId: card.id,
                    cardTitle: card.title,
                    reason: `Client hasn't progressed from Welcome in ${Math.floor(daysSinceStart)} days. Send follow-up email.`,
                    priority: 5
                });
            }
        }
    }

    // 4. URGENT MOVE (High priority tasks not moving)
    if (card.priority === 'Urgent' && column !== 'pulive') {
        actions.push({
            type: 'URGENT_MOVE',
            cardId: card.id,
            cardTitle: card.title,
            reason: 'Urgent priority card requires progression to next workflow stage',
            priority: 2
        });
    }

    return actions;
}

export function detectFollowUps(card: Card, laneTitle: string): FollowUpAction[] {
    const followUps: FollowUpAction[] = [];
    const now = new Date();
    const column = laneTitle.toLowerCase().replace(/\s/g, '');

    if (column.includes('done') || column.includes('archive')) return [];

    // 1. Check last activity (updatedAt)
    const updatedAt = new Date(card.updatedAt || card.createdAt || now);
    const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

    // 2. Check last comment
    let lastCommentDate = updatedAt;
    if (card.comments && card.comments.length > 0) {
        const sortedComments = [...card.comments].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        lastCommentDate = new Date(sortedComments[0].createdAt);
    }
    const daysSinceLastComment = (now.getTime() - lastCommentDate.getTime()) / (1000 * 60 * 60 * 24);

    // LOGIC: If no comment for > 3 days, trigger follow-up
    if (daysSinceLastComment > 3) {
        followUps.push({
            cardId: card.id,
            cardTitle: card.title,
            reason: `No communication for ${Math.floor(daysSinceLastComment)} days. Check in with client.`,
            daysSinceLastActivity: Math.floor(daysSinceLastComment),
            priority: daysSinceLastComment > 7 ? 'high' : daysSinceLastComment > 5 ? 'medium' : 'low'
        });
    }

    // LOGIC: If stagnant in column for > 4 days without update
    if (daysSinceUpdate > 4 && followUps.length === 0) {
        followUps.push({
            cardId: card.id,
            cardTitle: card.title,
            reason: `Stagnant in ${laneTitle} for ${Math.floor(daysSinceUpdate)} days without updates.`,
            daysSinceLastActivity: Math.floor(daysSinceUpdate),
            priority: daysSinceUpdate > 8 ? 'high' : 'medium'
        });
    }

    return followUps;
}
