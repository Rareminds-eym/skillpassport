import {afterEach, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import type {ButtonHTMLAttributes, PropsWithChildren} from 'react';
vi.mock('@/shared/ui', () => ({
  Card:({children}:PropsWithChildren)=><div>{children}</div>,
  CardContent:({children}:PropsWithChildren)=><div>{children}</div>,
  Label:({children}:PropsWithChildren)=><span>{children}</span>,
}));
vi.mock('@/shared/ui/ButtonNew', () => ({Button:({children,...props}:ButtonHTMLAttributes<HTMLButtonElement>)=><button {...props}>{children}</button>}));
import {StreamSelectionScreen} from '../StreamSelectionScreen';
afterEach(cleanup);
it.each([
  ['after10','science',/^Science \(PCM\)/,'science_pcm_after10'],
  ['after10','commerce',/^Commerce with Maths/,'commerce_maths_after10'],
  ['after10','arts',/^Arts with Psychology/,'arts_psychology_after10'],
  ['higher_secondary','science',/^Science \(PCM\)/,'science_pcm'],
  ['higher_secondary','commerce',/^Commerce with Maths/,'commerce_maths'],
  ['higher_secondary','arts',/^Arts with Psychology/,'arts_psychology'],
  ['after12','science',/^B.Sc Computer Science/,'cs'],
  ['after12','commerce',/^BBA General/,'bba'],
  ['after12','arts',/^BA \(English/,'ba'],
])('uses the canonical %s/%s catalog stream', (gradeLevel,selectedCategory,label,expected) => {
  const onStreamSelect=vi.fn();
  render(<StreamSelectionScreen gradeLevel={gradeLevel} selectedCategory={selectedCategory} onStreamSelect={onStreamSelect} onBack={vi.fn()}/>);
  fireEvent.click(screen.getByRole('button',{name:label as RegExp}));
  expect(onStreamSelect).toHaveBeenCalledWith(expected);
});
