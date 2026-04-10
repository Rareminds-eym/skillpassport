import { describe, it, expect } from 'vitest';
import {
  calculateStatusPercentages,
  processSkillsForChart,
  getTopLocations,
} from '../chartTransformations';

describe('chartTransformations', () => {
  describe('calculateStatusPercentages', () => {
    it('should calculate correct percentages', () => {
      const statusCounts = {
        accepted: 10,
        under_review: 20,
        pending: 30,
        rejected: 40,
      };
      
      const result = calculateStatusPercentages(statusCounts, 100);
      
      expect(result).toEqual([10, 20, 30, 40]);
    });

    it('should return zeros for empty data', () => {
      const result = calculateStatusPercentages({}, 0);
      expect(result).toEqual([0, 0, 0, 0]);
    });
  });

  describe('processSkillsForChart', () => {
    it('should capitalize skill names and limit results', () => {
      const skillsData = [
        { skill: 'javascript', total_mentions: '10' },
        { skill: 'python', total_mentions: '8' },
        { skill: 'react', total_mentions: '6' },
      ];
      
      const result = processSkillsForChart(skillsData, 2);
      
      expect(result).toEqual({
        Javascript: 10,
        Python: 8,
      });
    });

    it('should return empty object for empty data', () => {
      const result = processSkillsForChart([]);
      expect(result).toEqual({});
    });
  });

  describe('getTopLocations', () => {
    it('should return top N locations sorted by count', () => {
      const locationDistribution = {
        'New York': 50,
        'London': 30,
        'Tokyo': 20,
        'Paris': 15,
        'Berlin': 10,
        'Sydney': 5,
      };
      
      const result = getTopLocations(locationDistribution, 3);
      
      expect(result.labels).toEqual(['New York', 'London', 'Tokyo']);
      expect(result.values).toEqual([50, 30, 20]);
    });
  });
});
