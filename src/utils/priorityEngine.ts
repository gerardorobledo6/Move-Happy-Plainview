import { Card } from '../types';

export function calculatePriority(card: Card, laneTitle: string): 'Low' | 'Normal' | 'High' | 'Urgent' {
  const now = new Date();
  const column = laneTitle.toLowerCase().replace(/\s/g, '');

  switch (column) {
    case "welcome": {
      if (!card.plannedStart) return "Normal";
      const start = new Date(card.plannedStart);
      const days = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

      if (days <= 2) return "Normal";
      if (days <= 5) return "High";
      return "Urgent";
    }

    case "prep": {
      if (!card.pickupDate) return "Normal";
      const pickup = new Date(card.pickupDate);
      const days = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (days <= 10 && days >= 8) return "Normal";
      if (days < 8 && days >= 5) return "High";
      if (days < 5) return "Urgent";
      return "Normal";
    }

    case "premove": {
      if (!card.pickupDate) return "Normal";
      const pickup = new Date(card.pickupDate);
      const days = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (days <= 3 && days >= 2) return "High";
      if (days <= 1) return "Urgent";
      return "Normal";
    }

    case "pulive": {
      if (!card.pickupDate) return "Normal";
      const pickup = new Date(card.pickupDate);
      const days = (now.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24);

      if (days >= 1 && days <= 2) return "Normal";
      if (days > 2 && days <= 5) return "High";
      if (days > 5 && days <= 7) return "Urgent";
      return "Normal";
    }

    default:
      // Keep existing manual priority for columns not covered by rules
      return card.priority || "Normal";
  }
}
