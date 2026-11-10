// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import JobDescription from '../JobDescription';
import { jobDescriptionBlocks, jobDescriptionText } from '../../lib/jobDescription';

afterEach(cleanup);
describe('job description structure', () => {
  it('recovers explicit headings and bullets from a flattened export without changing its words', () => {
    const value = 'Job Summary Sell retail solutions. Key Responsibilities Consult customers. Requirements Qualifications & Experience Education • Degree required. • MBA preferred.Experience • Four years of sales. Preferred Industry Exposure • Retail Technology • Supply Chain & Logistics';
    render(<JobDescription value={value} />);
    expect(screen.getByRole('heading', {name:'Job Summary'})).toBeTruthy();
    expect(screen.getByRole('heading', {name:'Key Responsibilities'})).toBeTruthy();
    expect(screen.getByRole('heading', {name:'Experience'})).toBeTruthy();
    expect(screen.getByRole('heading', {name:'Qualifications & Experience'})).toBeTruthy();
    expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual(['Degree required.', 'MBA preferred.', 'Four years of sales.', 'Retail Technology', 'Supply Chain & Logistics']);
    expect(jobDescriptionText(value).replace(/\s|•/g, '')).toBe(value.replace(/\s|•/g, ''));
  });
  it('preserves rich paragraphs, entities, headings and wrapped bullet continuations as inert text', () => {
    render(<JobDescription value={'<h3>Role details</h3><b>Job Summary</b><p>Build A &amp; B.</p><p>Keep this paragraph.</p><ul><li>First requirement</li><li>Second requirement</li></ul><div>• A wrapped line<br/>continues here</div>'} />);
    expect(screen.getByRole('heading', {name:'Role details'})).toBeTruthy();
    expect(screen.getByRole('heading', {name:'Job Summary'})).toBeTruthy();
    expect(screen.queryByText('#')).toBeNull();
    expect(screen.getByText('Build A & B.')).toBeTruthy();
    expect(screen.getByText('Keep this paragraph.')).toBeTruthy();
    expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual(['First requirement', 'Second requirement', 'A wrapped line continues here']);
  });
  it('does not mount source elements, URLs, attributes, scripts or hidden style text', () => {
    const {container} = render(<JobDescription value={'<script>steal()</script><style>hidden()</style><iframe src="https://example.invalid"></iframe><img src=x onerror="steal()"><p onclick="steal()">Safe <a href="javascript:steal()">text</a></p>'} />);
    expect(container.textContent).toBe('Safe text');
    expect(container.querySelector('script,style,iframe,img,a,[onclick],[onerror]')).toBeNull();
  });
  it('keeps ordinary prose and line breaks without guessing new sections', () => {
    expect(jobDescriptionBlocks('Experience with Requirements management is helpful.')).toEqual([{type:'paragraph',text:'Experience with Requirements management is helpful.'}]);
    expect(jobDescriptionBlocks('One paragraph.\n\nA second paragraph.')).toHaveLength(2);
    expect(jobDescriptionText('Salary < 50000 and experience > 2 years')).toBe('Salary < 50000 and experience > 2 years');
  });
  it('provides an empty-description fallback', () => {
    render(<JobDescription value={null} />);
    expect(screen.getByText('The employer has not provided a description.')).toBeTruthy();
  });
});
