# Fee Management System - Database Schema & Integration Guide

## Database Tables

### 1. fee_structure Table
```sql
CREATE TABLE fee_structure (
  fee_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(class_id),
  fee_head VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) CHECK (amount > 0),
  frequency VARCHAR(20) CHECK (frequency IN ('monthly', 'term', 'annual')),
  late_fee_percent DECIMAL(5,2) CHECK (late_fee_percent <= 50 AND late_fee_percent >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. fee_payments Table
```sql
CREATE TABLE fee_payments (
  receipt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(student_id),
  fee_id UUID REFERENCES fee_structure(fee_id),
  amount DECIMAL(10,2) NOT NULL,
  mode VARCHAR(20) CHECK (mode IN ('upi', 'card', 'netbanking', 'cash')),
  status VARCHAR(20) CHECK (status IN ('success', 'pending', 'failed')),
  payment_date TIMESTAMP DEFAULT NOW(),
  transaction_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## UI Component Features

### FeeStructureSetup.tsx
✅ **Implemented Features:**
- Class selection dropdown (Class 1-12)
- Fee head input (Tuition, Bus, Exam, etc.)
- Amount input with currency symbol (₹)
- Frequency dropdown (Monthly, Term-wise, Annual)
- Late fee percentage (max 50%)
- Full CRUD operations (Create, Read, Update, Delete)
- Form validation with error messages
- Success/Error alerts
- Responsive design
- TypeScript support

### Data Flow
1. **Select Class** → Links fee structure to specific class
2. **Enter Fee Details** → Fee head, amount, frequency
3. **Set Late Fee** → Optional penalty percentage
4. **Save** → Creates fee template for that class
5. **Students in that class** → Automatically get this fee structure applied

## Integration Steps

### Backend API Endpoints Needed:

```typescript
// 1. Get all classes
GET /api/classes
Response: [{ class_id: UUID, name: string, section: string }]

// 2. Create fee structure
POST /api/fee-structure
Body: {
  class_id: UUID,
  fee_head: string,
  amount: number,
  frequency: 'monthly' | 'term' | 'annual',
  late_fee_percent?: number
}

// 3. Get fee structures
GET /api/fee-structure?class_id=UUID
Response: [{ fee_id, class_id, fee_head, amount, frequency, late_fee_percent }]

// 4. Update fee structure
PUT /api/fee-structure/:fee_id
Body: { fee_head, amount, frequency, late_fee_percent }

// 5. Delete fee structure
DELETE /api/fee-structure/:fee_id
```

## Example Usage

### Creating Fee Structure for Class 8:
```json
{
  "class_id": "uuid-class-8",
  "fee_head": "Tuition Fee",
  "amount": 35000,
  "frequency": "annual",
  "late_fee_percent": 5
}
```

### Result:
- All students in Class 8 will have ₹35,000 annual tuition fee
- If payment is late, 5% penalty applies
- System can auto-generate invoices based on frequency

## Payment Workflow

1. **Fee Structure Created** → Template exists for class
2. **Student Enrolled** → Gets assigned fee structure
3. **Invoice Generated** → Based on frequency (monthly/term/annual)
4. **Parent Pays** → Through payment gateway
5. **Payment Recorded** → In fee_payments table
6. **Receipt Generated** → Downloadable PDF

## Next Steps

To complete the fee management system:

1. **Backend Integration**
   - Create Supabase functions for CRUD operations
   - Add RLS policies for school admin access
   - Implement payment gateway integration

2. **Additional UI Components**
   - Fee Collection Dashboard
   - Payment History View
   - Invoice Generation
   - Receipt Download
   - Late Fee Calculator
   - Concession/Discount Management

3. **Reports**
   - Fee collection summary by class
   - Outstanding payments
   - Payment mode analysis
   - Late fee reports

## Database Indexes (for performance)
```sql
CREATE INDEX idx_fee_structure_class ON fee_structure(class_id);
CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_fee_payments_status ON fee_payments(status);
CREATE INDEX idx_fee_payments_date ON fee_payments(payment_date);
```
