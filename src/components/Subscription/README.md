# Payment Success Page Components

This directory contains reusable UI components for displaying payment success information with a modern, receipt-style design.

## Components

### SuccessHeader

Displays a success header with an animated checkmark icon.

**Props:**

- `title` (string, optional): Main heading text. Default: "Payment Success!"
- `subtitle` (string, optional): Subheading text. Default: "Your payment has been successfully done"

**Example:**

```jsx
import { SuccessHeader } from '../../components/Subscription';

<SuccessHeader title="Payment Success!" subtitle="Your payment has been successfully done" />;
```

**Features:**

- Animated checkmark with scale-in and stroke-draw animations
- Gradient background (green to blue)
- Responsive text sizing
- Proper ARIA labels for accessibility

---

### TransactionGrid

Displays transaction details in a 2x2 grid layout with bordered containers.

**Props:**

- `referenceNumber` (string, required): Payment reference/transaction ID
- `paymentTime` (string, required): Formatted payment timestamp
- `paymentMethod` (string, required): Payment method used
- `senderName` (string, required): Name of the person who made the payment

**Example:**

```jsx
import { TransactionGrid } from '../../components/Subscription';

<TransactionGrid
  referenceNumber="pay_ABC123XYZ"
  paymentTime="January 15, 2024"
  paymentMethod="Credit Card"
  senderName="John Doe"
/>;
```

**Features:**

- Responsive grid (1 column on mobile, 2 columns on larger screens)
- Monospace font for reference numbers
- Bordered containers for each detail
- Clear label/value structure

---

### ReceiptCard

A dark-themed receipt card with a scalloped bottom edge, displaying payment amount and transaction details.

**Props:**

- `totalAmount` (string, required): Formatted total payment amount
- `transactionDetails` (object, required): Transaction information
  - `referenceNumber` (string): Payment reference ID
  - `paymentTime` (string): Formatted payment timestamp
  - `paymentMethod` (string): Payment method used
  - `senderName` (string): Name of the payer
- `children` (ReactNode, optional): Additional content (subscription details, email status, action buttons, etc.)

**Example:**

```jsx
import { ReceiptCard } from '../../components/Subscription';

<ReceiptCard
  totalAmount="₹1,000"
  transactionDetails={{
    referenceNumber: 'pay_ABC123XYZ',
    paymentTime: 'January 15, 2024',
    paymentMethod: 'Credit Card',
    senderName: 'John Doe',
  }}
>
  {/* Additional content like subscription details, email status, buttons */}
  <div className="bg-blue-50 rounded-xl p-6">
    <h2>Subscription Details</h2>
    {/* ... */}
  </div>
</ReceiptCard>;
```

**Features:**

- Dark theme (gray-800 background) with white text
- Prominent total amount display (large, bold typography)
- Integrated TransactionGrid for transaction details
- Scalloped bottom edge decoration (receipt-style)
- Children content area with proper spacing
- Fully responsive design

---

## Design Specifications

### Colors

- Dark card background: `bg-gray-800` (#1F2937)
- White text on dark: `text-white`
- Grid item background: `bg-white`
- Border color: `border-gray-200`

### Typography

- Total amount: 48-60px, bold
- Section headings: 16-18px, semibold
- Labels: 12-14px, regular
- Values: 14-16px, medium weight
- Reference numbers: monospace font

### Spacing

- Card padding: 24-32px (responsive)
- Grid gap: 16px
- Section spacing: 24px

### Responsive Breakpoints

- Mobile: < 640px (single column)
- Tablet: 640px - 1023px (2 columns)
- Desktop: ≥ 1024px (2 columns)

## Accessibility

All components include:

- Proper ARIA labels for interactive elements
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly content
- Sufficient color contrast ratios

## Integration Example

See `src/pages/subscription/PaymentSuccess.jsx` for a complete integration example showing how these components work together to create a modern payment success page.
