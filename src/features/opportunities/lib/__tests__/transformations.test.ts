import { describe, it, expect } from 'vitest';
import {
  filterBySearchTerm,
  filterByActiveStatus,
  sortOpportunities,
  filterAndSortOpportunities,
} from '../transformations';

describe('opportunities transformations', () => {
  const mockOpportunities = [
    {
      id: '1',
      job_title: 'Software Engineer',
      company_name: 'Tech Corp',
      location: 'New York',
      is_active: true,
      saved_at: '2024-01-01',
      deadline: '2024-02-01',
    },
    {
      id: '2',
      job_title: 'Data Scientist',
      company_name: 'Data Inc',
      location: 'London',
      is_active: false,
      saved_at: '2024-01-15',
      deadline: '2024-01-20',
    },
    {
      id: '3',
      job_title: 'Product Manager',
      company_name: 'Product Co',
      location: 'Tokyo',
      is_active: true,
      saved_at: '2024-01-10',
      deadline: '2024-03-01',
    },
  ];

  describe('filterBySearchTerm', () => {
    it('should filter by job title', () => {
      const result = filterBySearchTerm(mockOpportunities, 'engineer');
      expect(result).toHaveLength(1);
      expect(result[0].job_title).toBe('Software Engineer');
    });

    it('should filter by company name', () => {
      const result = filterBySearchTerm(mockOpportunities, 'data');
      expect(result).toHaveLength(1);
      expect(result[0].company_name).toBe('Data Inc');
    });

    it('should return all for empty search', () => {
      const result = filterBySearchTerm(mockOpportunities, '');
      expect(result).toHaveLength(3);
    });
  });

  describe('filterByActiveStatus', () => {
    it('should filter active only', () => {
      const result = filterByActiveStatus(mockOpportunities, true);
      expect(result).toHaveLength(2);
      expect(result.every(o => o.is_active)).toBe(true);
    });

    it('should return all when not filtering', () => {
      const result = filterByActiveStatus(mockOpportunities, false);
      expect(result).toHaveLength(3);
    });
  });

  describe('sortOpportunities', () => {
    it('should sort by deadline', () => {
      const result = sortOpportunities(mockOpportunities, 'deadline');
      expect(result[0].id).toBe('2'); // earliest deadline
      expect(result[2].id).toBe('3'); // latest deadline
    });

    it('should sort by newest', () => {
      const result = sortOpportunities(mockOpportunities, 'newest');
      expect(result[0].id).toBe('2'); // most recent saved_at
    });
  });

  describe('filterAndSortOpportunities', () => {
    it('should combine filter and sort', () => {
      const result = filterAndSortOpportunities(
        mockOpportunities,
        'engineer',
        true,
        'deadline'
      );
      expect(result).toHaveLength(1);
      expect(result[0].job_title).toBe('Software Engineer');
    });
  });
});
