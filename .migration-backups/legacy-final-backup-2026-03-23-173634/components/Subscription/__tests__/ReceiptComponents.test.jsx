import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SuccessHeader from '../SuccessHeader';
import TransactionGrid from '../TransactionGrid';
import ReceiptCard from '../ReceiptCard';

describe('SuccessHeader Component', () => {
  it('should render with default props', () => {
    render(<SuccessHeader />);
    expect(screen.getByText('Payment Success!')).toBeInTheDocument();
    expect(screen.getByText('Your payment has been successfully done')).toBeInTheDocument();
  });

  it('should render with custom title and subtitle', () => {
    render(<SuccessHeader title="Custom Title" subtitle="Custom Subtitle" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Subtitle')).toBeInTheDocument();
  });

  it('should have success checkmark with proper aria-label', () => {
    render(<SuccessHeader />);
    const checkmark = screen.getByRole('img', { name: 'Success checkmark' });
    expect(checkmark).toBeInTheDocument();
  });
});

describe('TransactionGrid Component', () => {
  const mockTransactionData = {
    referenceNumber: 'pay_ABC123XYZ',
    paymentTime: 'January 15, 2024',
    paymentMethod: 'Credit Card',
    senderName: 'John Doe'
  };

  it('should render all transaction details', () => {
    render(<TransactionGrid {...mockTransactionData} />);
    
    expect(screen.getByText('Reference Number')).toBeInTheDocument();
    expect(screen.getByText('pay_ABC123XYZ')).toBeInTheDocument();
    
    expect(screen.getByText('Payment Time')).toBeInTheDocument();
    expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
    
    expect(screen.getByText('Payment Method')).toBeInTheDocument();
    expect(screen.getByText('Credit Card')).toBeInTheDocument();
    
    expect(screen.getByText('Sender Name')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display reference number in monospace font', () => {
    render(<TransactionGrid {...mockTransactionData} />);
    const referenceNumber = screen.getByText('pay_ABC123XYZ');
    expect(referenceNumber).toHaveClass('font-mono');
  });
});

describe('ReceiptCard Component', () => {
  const mockTransactionDetails = {
    referenceNumber: 'pay_ABC123XYZ',
    paymentTime: 'January 15, 2024',
    paymentMethod: 'Credit Card',
    senderName: 'John Doe'
  };

  it('should render total amount prominently', () => {
    render(
      <ReceiptCard 
        totalAmount="₹1,000" 
        transactionDetails={mockTransactionDetails}
      />
    );
    
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
  });

  it('should render transaction details section', () => {
    render(
      <ReceiptCard 
        totalAmount="₹1,000" 
        transactionDetails={mockTransactionDetails}
      />
    );
    
    expect(screen.getByText('Transaction Details')).toBeInTheDocument();
    expect(screen.getByText('pay_ABC123XYZ')).toBeInTheDocument();
  });

  it('should render children content when provided', () => {
    render(
      <ReceiptCard 
        totalAmount="₹1,000" 
        transactionDetails={mockTransactionDetails}
      >
        <div>Additional Content</div>
      </ReceiptCard>
    );
    
    expect(screen.getByText('Additional Content')).toBeInTheDocument();
  });

  it('should not render children section when no children provided', () => {
    const { container } = render(
      <ReceiptCard 
        totalAmount="₹1,000" 
        transactionDetails={mockTransactionDetails}
      />
    );
    
    // Check that there's no additional content section
    const contentSections = container.querySelectorAll('.space-y-6');
    expect(contentSections.length).toBe(0);
  });
});
