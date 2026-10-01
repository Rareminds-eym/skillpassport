import { useCallback, useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import FormField from '../FormField';
import GuardianInfoTab from '../ProfileSubTabs/GuardianInfoTab';
import ExperienceTab from '../ProfileSubTabs/ExperienceTab';
import CertificatesTab from '../ProfileSubTabs/CertificatesTab';

afterEach(cleanup);

function Form({ as = 'input', onSave }) {
  const [value, setValue] = useState('');
  const onChange = useCallback((_, next) => setValue(next), []);
  return <>
    <FormField label="Value" name="value" as={as} value={value} onChange={onChange} />
    <button onClick={() => onSave(value)}>Save</button>
  </>;
}

describe('settings regressions', () => {
  it.each(['input', 'textarea'])('preserves fast typing and immediate saves for %s', async (as) => {
    let saved;
    render(<Form as={as} onSave={value => { saved = value; }} />);
    await userEvent.setup().type(screen.getByRole('textbox'), 'abc');
    expect(screen.getByRole('textbox')).toHaveValue('abc');
    fireEvent.click(screen.getByText('Save'));
    expect(saved).toBe('abc');
  });

  it('renders Guardian Info and accepts changes', () => {
    let changed;
    const { container } = render(<GuardianInfoTab
      profileData={{ guardianName: '', guardianPhone: '', guardianEmail: '', guardianRelation: '' }}
      handleProfileChange={(...args) => { changed = args; }}
    />);
    expect(screen.getByText('Guardian Information')).toBeInTheDocument();
    fireEvent.change(container.querySelector('input'), { target: { value: 'Parent' } });
    expect(changed).toEqual(['guardianName', 'Parent']);
  });

  it('keeps verified experience and fallback skills visible while an edit is pending', () => {
    render(<ExperienceTab experienceData={[{
      id: 'experience-1', role: 'Unapproved edit', enabled: true,
      has_pending_edit: true, skills: ['JavaScript'],
      verified_data: { role: 'Verified role', organization: 'Example', start_date: '2020-01-01', end_date: '2021-01-01' },
    }]} />);
    expect(screen.getByText('Verified role')).toBeInTheDocument();
    expect(screen.queryByText('Unapproved edit')).not.toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('does not crash the certificate list on malformed legacy dates', () => {
    render(<CertificatesTab certificatesData={[{ id: 'certificate-1', title: 'Certificate', issuedOn: 'not-a-date' }]} />);
    expect(screen.getByText('Issued: Unknown date')).toBeInTheDocument();
  });

  it('does not crash the experience list on malformed legacy dates', () => {
    render(<ExperienceTab experienceData={[{ id: 'experience-1', role: 'Engineer', start_date: 'not-a-date' }]} />);
    expect(screen.getByText(/Unknown date/)).toBeInTheDocument();
  });
});
