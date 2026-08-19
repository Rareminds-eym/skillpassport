import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { LteLearningCard } from './LteLearningCard';
import type { LteLearningItem } from './LteLearningCard.types';

const baseItem: LteLearningItem = {
  id: 'cap-1',
  title: 'Support exchange member, listing, market-data and surveillance evidence handoffs',
  course: 'Support exchange member, listing, market-data and surveillance evidence handoffs',
  organization: 'Business Analyst',
  provider: 'Business Analyst',
  description: 'Evidence is captured and routed without market-integrity judgment.',
  status: 'in_progress',
  completedModules: 3,
  totalModules: 10,
  hoursSpent: 35,
  source: 'lte',
  resumeUrl: 'https://lte.rareminds.in/my-courses/BCP-CAP-CM-002',
  lteCode: 'BCP-CAP-CM-002',
  lteCurrentLevel: 2,
  lteTotalLevels: 4,
  lteLevels: [
    {
      id: 'lvl-1',
      code: 'L1',
      title: 'Foundation',
      status: 'completed',
      completionPercentage: 100,
      totalModules: 2,
      completedModules: 2,
    },
    {
      id: 'lvl-2',
      code: 'L2',
      title: 'Advanced',
      status: 'in_progress',
      completionPercentage: 50,
      totalModules: 2,
      completedModules: 1,
    },
    {
      id: 'lvl-3',
      code: 'L3',
      title: 'Expert',
      status: 'not_started',
      completionPercentage: 0,
      totalModules: 0,
      completedModules: 0,
    },
  ],
};

describe('LteLearningCard (grid)', () => {
  it('renders the header row: status badge and LTE badge', () => {
    render(<LteLearningCard item={baseItem} onContinue={vi.fn()} viewMode="grid" />);
    expect(screen.getByText('In Progress', { selector: '.font-semibold' })).toBeInTheDocument();
    expect(screen.getByText('LTE')).toBeInTheDocument();
    expect(screen.queryByText('BCP-CAP-CM-002')).not.toBeInTheDocument();
  });

  it('renders "In Progress" for the DB `ongoing` status instead of "Unknown"', () => {
    render(
      <LteLearningCard item={{ ...baseItem, status: 'ongoing' }} onContinue={vi.fn()} viewMode="grid" />,
    );
    expect(screen.getByText('In Progress', { selector: '.font-semibold' })).toBeInTheDocument();
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument();
  });

  it('renders title, role badge, description and meta row (level position, hours, xp, modules)', () => {
    render(<LteLearningCard item={baseItem} onContinue={vi.fn()} viewMode="grid" />);
    expect(screen.getByText('Support exchange member, listing, market-data and surveillance evidence handoffs')).toBeInTheDocument();
    expect(screen.getByText('Business Analyst')).toBeInTheDocument();
    expect(screen.getByText('Evidence is captured and routed without market-integrity judgment.')).toBeInTheDocument();
    expect(screen.getByText('Level 2 of 4')).toBeInTheDocument();
    expect(screen.getByText('35 hrs')).toBeInTheDocument();
    expect(screen.getByText(/3 of 10 modules/)).toBeInTheDocument();
  });

  it('collapses the level progress behind an accordion trigger by default', () => {
    render(<LteLearningCard item={baseItem} onContinue={vi.fn()} viewMode="grid" />);
    const trigger = screen.getByRole('button', { name: /Level progress/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Foundation')).not.toBeInTheDocument();
    expect(screen.queryByText('Advanced')).not.toBeInTheDocument();
  });

  it('expands the level progress accordion to show every level: ring percentage, code, title, status and count', () => {
    render(<LteLearningCard item={baseItem} onContinue={vi.fn()} viewMode="grid" />);
    fireEvent.click(screen.getByRole('button', { name: /Level progress/ }));
    expect(screen.getByRole('region', { name: 'Level progress' })).toBeInTheDocument();
    expect(screen.getByText('Foundation')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
    expect(screen.getAllByText('Completed')).toHaveLength(1);
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('does not render a module-count pill for levels without modules', () => {
    render(<LteLearningCard item={baseItem} onContinue={vi.fn()} viewMode="grid" />);
    fireEvent.click(screen.getByRole('button', { name: /Level progress/ }));
    const region = screen.getByRole('region', { name: 'Level progress' });
    const expertRow = within(region).getByText('Expert').closest('li');
    expect(expertRow?.querySelector('.rounded-full')).toBeNull();
  });

  it('collapses the level progress popover when the trigger is clicked again', () => {
    render(<LteLearningCard item={baseItem} onContinue={vi.fn()} viewMode="grid" />);
    const trigger = screen.getByRole('button', { name: /Level progress/ });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: 'Level progress' })).not.toBeInTheDocument();
  });

  it('closes the level progress popover when clicking outside', () => {
    render(<LteLearningCard item={baseItem} onContinue={vi.fn()} viewMode="grid" />);
    fireEvent.click(screen.getByRole('button', { name: /Level progress/ }));
    expect(screen.getByRole('region', { name: 'Level progress' })).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('region', { name: 'Level progress' })).not.toBeInTheDocument();
  });

  it('closes the level progress popover on Escape', () => {
    render(<LteLearningCard item={baseItem} onContinue={vi.fn()} viewMode="grid" />);
    fireEvent.click(screen.getByRole('button', { name: /Level progress/ }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('region', { name: 'Level progress' })).not.toBeInTheDocument();
  });

  it('does not render per-level dropdowns', () => {
    render(<LteLearningCard item={baseItem} onContinue={vi.fn()} viewMode="grid" />);
    expect(screen.queryAllByRole('button', { name: /^L[1-3]/ })).toHaveLength(0);
    expect(screen.queryByText('Intro to Evidence')).not.toBeInTheDocument();
  });

  it('renders the "Course content not live yet" fallback when lteLevels is empty and hides the ladder', () => {
    const noContent = { ...baseItem, lteLevels: [], lteTotalLevels: 0, totalModules: 0 };
    render(<LteLearningCard item={noContent} onContinue={vi.fn()} viewMode="grid" />);
    expect(screen.getByText('Course content not live yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Level progress/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
  });

  it('fires onContinue with the item when Continue is clicked', () => {
    const onContinue = vi.fn();
    render(<LteLearningCard item={baseItem} onContinue={onContinue} viewMode="grid" />);
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(onContinue).toHaveBeenCalledWith(baseItem);
  });

  it('shows a completed state when status is completed', () => {
    render(
      <LteLearningCard
        item={{ ...baseItem, status: 'completed', lteCurrentLevel: 4, completedModules: 10 }}
        onContinue={vi.fn()}
        viewMode="grid"
      />,
    );
    const completedNodes = Array.from(document.querySelectorAll('span, div'))
      .filter((el) => el.textContent === 'Completed')
      .map((el) => el.className as string);
    expect(completedNodes.filter((c) => c.includes('font-semibold'))).toHaveLength(1);
    expect(completedNodes.filter((c) => c.includes('font-bold'))).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /Continue/ })).not.toBeInTheDocument();
  });
});

describe('LteLearningCard (list)', () => {
  it('renders a compact horizontal variant without the ladder', () => {
    render(<LteLearningCard item={baseItem} onContinue={vi.fn()} viewMode="list" />);
    expect(screen.queryByText('BCP-CAP-CM-002')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /^L[1-3]/ })).toHaveLength(0);
    expect(screen.getByRole('button', { name: /Continue/ })).toBeInTheDocument();
  });
});
describe('LteLearningCard (multiple cards in a grid)', () => {
  it('expands only the clicked card accordion, other cards stay collapsed', () => {
    const secondItem = { ...baseItem, id: 'cap-2', title: 'Another capability', course: 'Another capability' };
    render(
      <div>
        <LteLearningCard item={baseItem} onContinue={vi.fn()} viewMode="grid" />
        <LteLearningCard item={secondItem} onContinue={vi.fn()} viewMode="grid" />
      </div>,
    );
    const triggers = screen.getAllByRole('button', { name: /Level progress/ });
    expect(triggers).toHaveLength(2);
    fireEvent.click(triggers[0]);
    expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByRole('region', { name: 'Level progress' })).toHaveLength(1);
  });
});
