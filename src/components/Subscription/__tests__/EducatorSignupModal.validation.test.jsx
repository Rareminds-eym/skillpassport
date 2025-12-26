import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EducatorSignupModal from '../EducatorSignupModal';

// Mock the userApiService (new service)
vi.mock('../../../services/userApiService', () => ({
    signupEducator: vi.fn(),
    signupCollegeEducator: vi.fn(),
    checkEmail: vi.fn().mockResolvedValue({ success: true, exists: false }),
    getSchools: vi.fn().mockResolvedValue({ 
        success: true, 
        data: [
            { id: '1', name: 'Test School', city: 'City', state: 'State', country: 'Country' }
        ] 
    }),
    getColleges: vi.fn().mockResolvedValue({ 
        success: true, 
        data: [
            { id: '1', name: 'Test College', city: 'City', state: 'State', country: 'Country' }
        ] 
    })
}));

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    selectedPlan: { name: 'Test Plan', price: 1000, duration: 'month' },
    onSignupSuccess: vi.fn(),
    onSwitchToLogin: vi.fn(),
    studentType: 'school-educator'
};

const renderModal = (props = {}) => {
    return render(
        <BrowserRouter>
            <EducatorSignupModal {...defaultProps} {...props} />
        </BrowserRouter>
    );
};

describe('EducatorSignupModal - Institution Validation', () => {
    it('should display error when no institution is selected for school educator', async () => {
        renderModal({ studentType: 'school-educator' });

        // Wait for institutions to load
        await waitFor(() => {
            expect(screen.queryByText(/Loading schools.../i)).not.toBeInTheDocument();
        });

        // Fill in all required fields except institution
        fireEvent.change(screen.getByPlaceholderText(/John/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText(/Doe/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByPlaceholderText(/your.email@school.edu/i), { target: { value: 'test@school.edu' } });
        fireEvent.change(screen.getByPlaceholderText(/Min. 8 characters/i), { target: { value: 'Password123' } });
        fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), { target: { value: 'Password123' } });

        // Submit form without selecting institution
        const submitButton = screen.getByRole('button', { name: /Sign Up & Continue/i });
        fireEvent.click(submitButton);

        // Check for validation error
        await waitFor(() => {
            expect(screen.getByText(/Please select a school/i)).toBeInTheDocument();
        });
    });

    it('should display error when no institution is selected for college educator', async () => {
        renderModal({ studentType: 'college-educator' });

        // Wait for institutions to load
        await waitFor(() => {
            expect(screen.queryByText(/Loading colleges.../i)).not.toBeInTheDocument();
        });

        // Fill in all required fields except institution
        fireEvent.change(screen.getByPlaceholderText(/John/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText(/Doe/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByPlaceholderText(/your.email@school.edu/i), { target: { value: 'test@college.edu' } });
        fireEvent.change(screen.getByPlaceholderText(/Min. 8 characters/i), { target: { value: 'Password123' } });
        fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), { target: { value: 'Password123' } });

        // Submit form without selecting institution
        const submitButton = screen.getByRole('button', { name: /Sign Up & Continue/i });
        fireEvent.click(submitButton);

        // Check for validation error
        await waitFor(() => {
            expect(screen.getByText(/Please select a college/i)).toBeInTheDocument();
        });
    });

    it('should clear error when institution is selected', async () => {
        renderModal({ studentType: 'school-educator' });

        // Wait for institutions to load
        await waitFor(() => {
            expect(screen.queryByText(/Loading schools.../i)).not.toBeInTheDocument();
        });

        // Fill in all required fields except institution
        fireEvent.change(screen.getByPlaceholderText(/John/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText(/Doe/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByPlaceholderText(/your.email@school.edu/i), { target: { value: 'test@school.edu' } });
        fireEvent.change(screen.getByPlaceholderText(/Min. 8 characters/i), { target: { value: 'Password123' } });
        fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), { target: { value: 'Password123' } });

        // Submit form without selecting institution
        const submitButton = screen.getByRole('button', { name: /Sign Up & Continue/i });
        fireEvent.click(submitButton);

        // Check for validation error
        await waitFor(() => {
            expect(screen.getByText(/Please select a school/i)).toBeInTheDocument();
        });

        // Now select an institution
        const institutionSelect = screen.getByRole('combobox');
        fireEvent.change(institutionSelect, { target: { value: '1' } });

        // Error should be cleared
        await waitFor(() => {
            expect(screen.queryByText(/Please select a school/i)).not.toBeInTheDocument();
        });
    });

    it('should not submit form when institution is not selected', async () => {
        const onSignupSuccess = vi.fn();
        renderModal({ studentType: 'school-educator', onSignupSuccess });

        // Wait for institutions to load
        await waitFor(() => {
            expect(screen.queryByText(/Loading schools.../i)).not.toBeInTheDocument();
        });

        // Fill in all required fields except institution
        fireEvent.change(screen.getByPlaceholderText(/John/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText(/Doe/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByPlaceholderText(/your.email@school.edu/i), { target: { value: 'test@school.edu' } });
        fireEvent.change(screen.getByPlaceholderText(/Min. 8 characters/i), { target: { value: 'Password123' } });
        fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), { target: { value: 'Password123' } });

        // Submit form
        const submitButton = screen.getByRole('button', { name: /Sign Up & Continue/i });
        fireEvent.click(submitButton);

        // onSignupSuccess should not be called
        await waitFor(() => {
            expect(onSignupSuccess).not.toHaveBeenCalled();
        });
    });
});
