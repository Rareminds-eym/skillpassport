'use client';
import React, { useCallback, useState } from 'react';
import { cn } from '../../../utils/cn';

interface Cell {
  row: number;
  col: number;
}

interface DivGridProps {
  rows: number;
  cols: number;
  borderColor: string;
  fillColor: string;
  clickedCell: Cell | null;
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
  className?: string;
}

const DivGrid: React.FC<DivGridProps> = ({
  rows,
  cols,
  borderColor,
  fillColor,
  clickedCell,
  onCellClick,
  interactive = false,
  className,
}) => {
  const getDistance = (row: number, col: number): number => {
    if (!clickedCell) return Infinity;
    const dx = clickedCell.col - col;
    const dy = clickedCell.row - row;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getDelay = (distance: number): number => {
    return distance * 50; // 50ms delay per cell distance
  };

  return (
    <div
      className={cn('absolute inset-0 overflow-hidden', className)}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: '1px',
      }}
    >
      {Array.from({ length: rows * cols }).map((_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const distance = getDistance(row, col);
        const delay = getDelay(distance);

        return (
          <div
            key={index}
            onClick={() => interactive && onCellClick?.(row, col)}
            className={cn(
              'relative w-full h-full',
              interactive && 'cursor-pointer hover:opacity-60 transition-opacity'
            )}
            style={{
              border: `1px solid ${borderColor}`,
              backgroundColor: fillColor,
              opacity: 0.4,
              animation:
                clickedCell && distance < Infinity
                  ? `cell-ripple 600ms ease-out ${delay}ms`
                  : 'none',
              aspectRatio: '1 / 1',
            }}
          />
        );
      })}
    </div>
  );
};

interface BackgroundRippleEffectProps {
  rows?: number;
  cols?: number;
  className?: string;
  borderColor?: string;
  fillColor?: string;
}

export const BackgroundRippleEffect: React.FC<BackgroundRippleEffectProps> = ({
  rows = 8,
  cols = 25,
  className,
  borderColor = 'rgba(99, 102, 241, 0.2)', // indigo-500 with opacity (default for dark mode)
  fillColor = 'rgba(99, 102, 241, 0.05)', // indigo-500 with very low opacity (default for dark mode)
}) => {
  const [clickedCell, setClickedCell] = useState<Cell | null>(null);

  const handleCellClick = useCallback((row: number, col: number) => {
    setClickedCell({ row, col });
    // Reset after animation completes
    setTimeout(() => setClickedCell(null), 2000);
  }, []);

  return (
    <DivGrid
      rows={rows}
      cols={cols}
      borderColor={borderColor}
      fillColor={fillColor}
      clickedCell={clickedCell}
      onCellClick={handleCellClick}
      interactive={true}
      className={className}
    />
  );
};
