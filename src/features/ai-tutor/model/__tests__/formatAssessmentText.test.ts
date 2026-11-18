import {describe,it,expect} from 'vitest';
import {formatAssessmentText} from '../formatAssessmentText';
describe('assessment math display',()=>{
  it('removes math delimiters while retaining normal parentheses',()=>{
    expect(formatAssessmentText(String.raw`discharge (\(Q\)) in a river`)).toBe('discharge (Q) in a river');
    expect(formatAssessmentText(String.raw`\(Q = A \times v\)`)).toBe('Q = A × v');
    expect(formatAssessmentText(String.raw`\\(Q = A \\times v\\)`)).toBe('Q = A × v');
  });
  it('preserves prose, currency and unsupported expressions without guessing',()=>{
    expect(formatAssessmentText('A pipe costs $25 (per metre).')).toBe('A pipe costs $25 (per metre).');
    expect(formatAssessmentText(String.raw`\(\unknown{x}\)`)).toBe(String.raw`\unknown{x}`);
    expect(formatAssessmentText(null)).toBe('');
  });
  it('formats common units and Greek symbols within math only',()=>{
    expect(formatAssessmentText(String.raw`\[\rho = 1000\ \mathrm{kg}/m^{3}\]`)).toContain('ρ = 1000');
    expect(formatAssessmentText(String.raw`\(m^{3}/s\)`)).toBe('m³/s');
  });
});
