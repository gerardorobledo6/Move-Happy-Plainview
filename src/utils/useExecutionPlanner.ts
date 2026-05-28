import { useMemo } from 'react';
import { Lane, Card, User } from '../types';
import { calculatePriority } from './priorityEngine';
import { calculateRiskForecast, RiskForecast, AIAction, generateAIActions, FollowUpAction, detectFollowUps } from './predictiveEngine';

export interface PlannedCard extends Card {
    dynamicPriority: 'Urgent' | 'High' | 'Normal' | 'Low';
    estimatedHours: number;
    score: number;
    columnName: string;
    workflowStatusLabel: string;
    timeContext: string;
    aiUrgencyExplanation: string;
    riskForecast: RiskForecast | null;
    aiActions: AIAction[];
}

export interface DailyPlan {
    aiAgenda: AIAction[];
    followUpAgenda: FollowUpAction[];
    urgent: PlannedCard[];
    high: PlannedCard[];
    normal: PlannedCard[];
    executionOrder: PlannedCard[];
    totalEstimatedHours: number;
}

export const useExecutionPlanner = (lanes: Lane[], currentUser: User | null): DailyPlan => {
    return useMemo(() => {
        const urgent: PlannedCard[] = [];
        const high: PlannedCard[] = [];
        const normal: PlannedCard[] = [];
        const aiAgenda: AIAction[] = [];
        const followUpAgenda: FollowUpAction[] = [];
        let totalEstimatedHours = 0;

        if (!currentUser) return { aiAgenda, followUpAgenda, urgent, high, normal, executionOrder: [], totalEstimatedHours: 0 };

        const allUserTasks: PlannedCard[] = [];

        lanes.forEach(lane => {
            const titleLower = lane.title.toLowerCase();
            const isDoneLane = titleLower.includes('done') || 
                               titleLower.includes('finished') || 
                               titleLower.includes('archive');
            
            if (isDoneLane) return;

            lane.cards.forEach(card => {
                const isAssigned = card.assignedUsers.some(u => u.id === currentUser.id);
                if (!isAssigned) return;

                const dynamicPriority = calculatePriority(card, lane.title);
                
                // Assume 1.5 hours if estimatedHours is not explicitly set in the future
                const estimatedHours = (card as any).estimatedHours || 1.5;
                
                let score = 0;
                let workflowStatusLabel = "Pending";
                let timeContext = "No date set";
                let aiUrgencyExplanation = "Normal priority based on standard workflow rules";
                const now = new Date();

                if (titleLower.includes('welcome') && card.plannedStart) {
                    const start = new Date(card.plannedStart);
                    const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    timeContext = `${Math.abs(days)} days ${days >= 0 ? 'since start' : 'until start'}`;
                    
                    if (days <= 2) {
                        workflowStatusLabel = "Pending Welcome";
                        aiUrgencyExplanation = "Recently assigned — within expected start window";
                    } else if (days <= 5) {
                        workflowStatusLabel = "Delayed Welcome";
                        aiUrgencyExplanation = "Task is aging in Welcome stage — approaching delay threshold";
                    } else {
                        workflowStatusLabel = "Overdue Welcome";
                        aiUrgencyExplanation = "Task is overdue in Welcome stage — exceeds allowed start window";
                    }
                    
                    score = start.getTime();
                } else if (titleLower.includes('prep') && card.pickupDate) {
                    const pickup = new Date(card.pickupDate);
                    const days = Math.floor((pickup.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    timeContext = `${Math.abs(days)} days ${days >= 0 ? 'until pickup' : 'since pickup'}`;
                    
                    if (days >= 8) {
                        workflowStatusLabel = "Pending Prep";
                        aiUrgencyExplanation = "On track — within preparation window";
                    } else if (days >= 5) {
                        workflowStatusLabel = "Active Prep";
                        aiUrgencyExplanation = "Preparation time is decreasing — action required soon";
                    } else {
                        workflowStatusLabel = "Urgent Prep";
                        aiUrgencyExplanation = "Risk of missing pickup preparation deadline";
                    }
                    
                    score = pickup.getTime();
                } else if (titleLower.includes('premove') && card.pickupDate) {
                    const pickup = new Date(card.pickupDate);
                    const days = Math.floor((pickup.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    timeContext = `${Math.abs(days)} days ${days >= 0 ? 'until pickup' : 'since pickup'}`;
                    
                    if (days >= 2) {
                        workflowStatusLabel = "Pending Premove";
                        aiUrgencyExplanation = "Final logistics preparation window";
                    } else {
                        workflowStatusLabel = "Urgent Premove";
                        aiUrgencyExplanation = "Critical pre-move stage — immediate action required";
                    }
                    
                    score = pickup.getTime();
                } else if (titleLower.includes('pu live') || titleLower.includes('pulive')) {
                    if (card.pickupDate) {
                        const pickup = new Date(card.pickupDate);
                        const days = Math.floor((now.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
                        timeContext = `${Math.abs(days)} days ${days >= 0 ? 'since pickup' : 'until pickup'}`;
                        
                        if (days <= 2) {
                            workflowStatusLabel = "Pending PU Live";
                            aiUrgencyExplanation = "Post-pickup processing in progress";
                        } else if (days <= 5) {
                            workflowStatusLabel = "Delayed PU Live";
                            aiUrgencyExplanation = "Delayed completion of post-pickup workflow";
                        } else {
                            workflowStatusLabel = "Overdue PU Live";
                            aiUrgencyExplanation = "Overdue post-pickup closure — needs immediate attention";
                        }
                        
                        score = pickup.getTime();
                    }
                } else {
                    if (card.pickupDate) score = new Date(card.pickupDate).getTime();
                    else if (card.plannedStart) score = new Date(card.plannedStart).getTime();
                    else score = Date.now() + 10000000000;
                }

                // If task is blocked, it shouldn't be executed immediately, lower priority score artificially
                if (card.status === 'Blocked') {
                    score += 10000000000;
                    workflowStatusLabel = "Blocked";
                }

                const riskForecast = calculateRiskForecast(card, lane.title);
                const aiActions = generateAIActions(card, lane.title, riskForecast);
                aiAgenda.push(...aiActions);

                const followUps = detectFollowUps(card, lane.title);
                followUpAgenda.push(...followUps);

                const plannedCard: PlannedCard = {
                    ...card,
                    dynamicPriority,
                    estimatedHours,
                    score,
                    columnName: lane.title,
                    workflowStatusLabel,
                    timeContext,
                    aiUrgencyExplanation,
                    riskForecast,
                    aiActions
                };

                allUserTasks.push(plannedCard);
                totalEstimatedHours += estimatedHours;
            });
        });

        // Sort by time sensitivity
        allUserTasks.sort((a, b) => a.score - b.score);

        // Group by priority
        allUserTasks.forEach(card => {
            if (card.dynamicPriority === 'Urgent') urgent.push(card);
            else if (card.dynamicPriority === 'High') high.push(card);
            else normal.push(card);
        });

        const executionOrder = [...urgent, ...high, ...normal];

        // Sort AI Agenda by priority
        aiAgenda.sort((a, b) => a.priority - b.priority);

        return {
            aiAgenda,
            followUpAgenda,
            urgent,
            high,
            normal,
            executionOrder,
            totalEstimatedHours
        };
    }, [lanes, currentUser]);
};
