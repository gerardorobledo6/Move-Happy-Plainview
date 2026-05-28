import { useMemo } from 'react';
import { Lane, Card } from '../types';

export interface KanbanInsights {
    healthScore: number;
    healthStatus: 'healthy' | 'moderate' | 'critical';
    bottlenecks: { laneTitle: string; count: number; percentage: number }[];
    blockedCount: number;
    overdueCount: number;
    recommendations: string[];
}

export const useKanbanIntelligence = (lanes: Lane[]): KanbanInsights => {
    return useMemo(() => {
        let totalTasks = 0;
        let blockedCount = 0;
        let overdueCount = 0;
        
        const now = new Date();
        const laneStats = lanes.map(lane => {
            const cardCount = lane.cards.length;
            totalTasks += cardCount;

            lane.cards.forEach(card => {
                if (card.status === 'Blocked') blockedCount++;
                if (card.plannedFinish) {
                    const finishDate = new Date(card.plannedFinish);
                    if (finishDate < now) overdueCount++;
                }
            });

            return {
                id: lane.id,
                title: lane.title,
                count: cardCount
            };
        });

        const bottlenecks: { laneTitle: string; count: number; percentage: number }[] = [];
        const recommendations: string[] = [];

        if (totalTasks > 0) {
            laneStats.forEach(stat => {
                const percentage = Math.round((stat.count / totalTasks) * 100);
                const titleLower = stat.title.toLowerCase();
                // Exclude typical entry and exit columns from being flagged as bottlenecks
                const isBoundary = titleLower.includes('welcome') || 
                                   titleLower.includes('backlog') || 
                                   titleLower.includes('done') || 
                                   titleLower.includes('finished') ||
                                   titleLower.includes('archive');

                if (!isBoundary && stat.count > 3 && percentage > 35) {
                    bottlenecks.push({
                        laneTitle: stat.title,
                        count: stat.count,
                        percentage
                    });
                }
            });
        }

        let healthScore = 100;
        healthScore -= (bottlenecks.length * 15);
        healthScore -= (blockedCount * 8);
        healthScore -= (overdueCount * 5);
        healthScore = Math.max(0, Math.min(100, healthScore));

        let healthStatus: 'healthy' | 'moderate' | 'critical' = 'healthy';
        if (healthScore < 60) healthStatus = 'critical';
        else if (healthScore < 85) healthStatus = 'moderate';

        // Generate dynamic recommendations
        if (bottlenecks.length > 0) {
            bottlenecks.forEach(b => {
                recommendations.push(`Column '${b.laneTitle}' is overloaded by ${b.percentage}%. Consider splitting it into smaller stages or stopping new work.`);
            });
        }
        
        if (blockedCount > 0) {
            recommendations.push(`There are ${blockedCount} blocked tasks requiring immediate attention.`);
        }
        
        if (overdueCount > 0) {
            recommendations.push(`${overdueCount} tasks have passed their planned finish date. Check their status.`);
        }

        // Workload balance check (std dev approach simplification)
        if (bottlenecks.length === 0 && totalTasks > 5 && healthScore > 85) {
            recommendations.push("Workflow is well-balanced. Keep up the steady flow!");
        } else if (recommendations.length === 0 && totalTasks === 0) {
            recommendations.push("Board is empty. Time to add some new clients!");
        }

        return {
            healthScore,
            healthStatus,
            bottlenecks,
            blockedCount,
            overdueCount,
            recommendations
        };
    }, [lanes]);
};
