import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { BrowserRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import DigitalPortfolioSideDrawer, { mainMenuItems, settingsMenuItems } from '../DigitalPortfolioSideDrawer';

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Wrapper component for tests
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('DigitalPortfolioSideDrawer', () => {
  const mockOnClose = vi.fn();
  const mockOnOpen = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnOpen.mockClear();
  });

  /**
   * Feature: student-digital-portfolio-nav-merge, Property 1: Side drawer displays on interaction
   * Validates: Requirements 1.1, 1.2
   */
  describe('Property 1: Side drawer displays on interaction', () => {
    it('should render side drawer when isOpen is true', () => {
      render(
        <TestWrapper>
          <DigitalPortfolioSideDrawer isOpen={true} onClose={mockOnClose} onOpen={mockOnOpen} />
        </TestWrapper>
      );

      // Verify side drawer is visible with main items
      expect(screen.getByText('Portfolio Mode')).toBeInTheDocument();
      expect(screen.getByText('Passport Mode')).toBeInTheDocument();
      expect(screen.getByText('Video Portfolio')).toBeInTheDocument();
      
      // Verify settings section
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Theme Settings')).toBeInTheDocument();
      expect(screen.getByText('Portfolio Layout')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Sharing')).toBeInTheDocument();
    });

    it('should show menu button when isOpen is false', () => {
      render(
        <TestWrapper>
          <DigitalPortfolioSideDrawer isOpen={false} onClose={mockOnClose} onOpen={mockOnOpen} />
        </TestWrapper>
      );

      // Menu button should be visible
      expect(screen.getByLabelText('Open Digital Portfolio Menu')).toBeInTheDocument();
      // Side drawer content should not be visible
      expect(screen.queryByText('Portfolio Mode')).not.toBeInTheDocument();
    });

    it('should call onOpen when menu button is clicked while closed', () => {
      render(
        <TestWrapper>
          <DigitalPortfolioSideDrawer isOpen={false} onClose={mockOnClose} onOpen={mockOnOpen} />
        </TestWrapper>
      );

      const menuButton = screen.getByLabelText('Open Digital Portfolio Menu');
      fireEvent.click(menuButton);
      expect(mockOnOpen).toHaveBeenCalled();
    });

    // Property-based test
    it('property: side drawer visibility matches isOpen state', () => {
      fc.assert(
        fc.property(fc.boolean(), (isOpen) => {
          const { container } = render(
            <TestWrapper>
              <DigitalPortfolioSideDrawer isOpen={isOpen} onClose={mockOnClose} onOpen={mockOnOpen} />
            </TestWrapper>
          );

          const portfolioElement = screen.queryByText('Portfolio Mode');
          
          if (isOpen) {
            expect(portfolioElement).toBeInTheDocument();
          } else {
            expect(portfolioElement).not.toBeInTheDocument();
          }

          container.remove();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: student-digital-portfolio-nav-merge, Property 7: Menu items have icons
   * Validates: Requirements 5.2
   */
  describe('Property 7: Menu items have icons', () => {
    it('should render icons for all menu items', () => {
      render(
        <TestWrapper>
          <DigitalPortfolioSideDrawer isOpen={true} onClose={mockOnClose} onOpen={mockOnOpen} />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      
      // Filter to menu item buttons (exclude close button)
      const menuButtons = buttons.filter(btn => 
        btn.textContent?.includes('Portfolio Mode') ||
        btn.textContent?.includes('Passport Mode') ||
        btn.textContent?.includes('Video Portfolio') ||
        btn.textContent?.includes('Theme Settings') ||
        btn.textContent?.includes('Portfolio Layout') ||
        btn.textContent?.includes('Export') ||
        btn.textContent?.includes('Sharing')
      );

      menuButtons.forEach(button => {
        const svg = button.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    // Property-based test
    it('property: all menu items in config have icons defined', () => {
      const allItems = [...mainMenuItems, ...settingsMenuItems];
      
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: allItems.length - 1 }),
          (index) => {
            const item = allItems[index];
            expect(item.icon).toBeDefined();
            expect(typeof item.icon === 'function' || typeof item.icon === 'object').toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Side drawer interactions', () => {
    it('should close on Escape key press', () => {
      render(
        <TestWrapper>
          <DigitalPortfolioSideDrawer isOpen={true} onClose={mockOnClose} onOpen={mockOnOpen} />
        </TestWrapper>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close when close button is clicked', () => {
      render(
        <TestWrapper>
          <DigitalPortfolioSideDrawer isOpen={true} onClose={mockOnClose} onOpen={mockOnOpen} />
        </TestWrapper>
      );

      const closeButton = screen.getByLabelText('Close menu');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should have Menu title in header', () => {
      render(
        <TestWrapper>
          <DigitalPortfolioSideDrawer isOpen={true} onClose={mockOnClose} onOpen={mockOnOpen} />
        </TestWrapper>
      );

      expect(screen.getByText('Menu')).toBeInTheDocument();
    });
  });
});
