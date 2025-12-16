-- =====================================================
-- COLLEGE DASHBOARD - DEPARTMENT BUDGET TABLES
-- Budget Management & Expenditure Tracking
-- =====================================================
-- Created: December 2024
-- Purpose: Department budget allocation and expense tracking
-- Dependencies: users, departments
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. DEPARTMENT BUDGETS TABLE
-- Purpose: Department budget allocation with approval workflow
-- =====================================================
CREATE TABLE IF NOT EXISTS department_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Department Reference
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  department_name TEXT NOT NULL,
  
  -- Budget Period
  financial_year TEXT NOT NULL, -- e.g., "2024-25"
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  quarter TEXT CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4', 'Annual')),
  
  -- Budget Heads (JSONB)
  -- Format: [
  --   {"head": "Salaries", "allocated": 500000, "spent": 0, "remaining": 500000},
  --   {"head": "Equipment", "allocated": 200000, "spent": 0, "remaining": 200000},
  --   ...
  -- ]
  budget_heads JSONB NOT NULL DEFAULT '[]',
  
  -- Total Budget
  total_allocated DECIMAL(12,2) NOT NULL,
  total_spent DECIMAL(12,2) DEFAULT 0,
  total_remaining DECIMAL(12,2) GENERATED ALWAYS AS (total_allocated - total_spent) STORED,
  utilization_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_allocated > 0 THEN (total_spent / total_allocated * 100)
      ELSE 0
    END
  ) STORED,
  
  -- Carry Forward
  carry_forward_amount DECIMAL(12,2) DEFAULT 0,
  carry_forward_from TEXT, -- Previous budget ID or period
  
  -- Status & Workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'active', 'closed', 'cancelled')),
  is_locked BOOLEAN DEFAULT FALSE,
  
  -- Approval
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approval_remarks TEXT,
  
  -- Revision
  revision_number INTEGER DEFAULT 1,
  previous_budget_id UUID REFERENCES department_budgets(id),
  revision_reason TEXT,
  
  -- Alerts
  alert_threshold_percentage DECIMAL(5,2) DEFAULT 80, -- Alert when 80% spent
  alert_sent BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(department_id, financial_year, quarter),
  CONSTRAINT valid_period CHECK (period_to > period_from),
  CONSTRAINT valid_budget_amounts CHECK (
    total_allocated >= 0 AND 
    total_spent >= 0 AND 
    carry_forward_amount >= 0
  ),
  CONSTRAINT valid_threshold CHECK (
    alert_threshold_percentage >= 0 AND 
    alert_threshold_percentage <= 100
  )
);

-- Indexes for department_budgets
CREATE INDEX idx_department_budgets_department ON department_budgets(department_id);
CREATE INDEX idx_department_budgets_financial_year ON department_budgets(financial_year);
CREATE INDEX idx_department_budgets_status ON department_budgets(status);
CREATE INDEX idx_department_budgets_period ON department_budgets(period_from, period_to);
CREATE INDEX idx_department_budgets_utilization ON department_budgets(utilization_percentage);

-- =====================================================
-- 2. EXPENDITURES TABLE
-- Purpose: Track department expenses against budget
-- =====================================================
CREATE TABLE IF NOT EXISTS expenditures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Department & Budget Reference
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES department_budgets(id) ON DELETE CASCADE,
  
  -- Budget Head
  budget_head_id TEXT NOT NULL, -- Reference to budget_heads array
  budget_head_name TEXT NOT NULL,
  
  -- Expenditure Details
  expenditure_number TEXT UNIQUE NOT NULL, -- Auto-generated: EXP-DEPT-YEAR-SEQ
  expenditure_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Vendor Details
  vendor_name TEXT NOT NULL,
  vendor_contact TEXT,
  vendor_email TEXT,
  vendor_gstin TEXT,
  
  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
  
  -- Category
  category TEXT NOT NULL CHECK (category IN (
    'Salaries', 'Equipment', 'Maintenance', 'Supplies', 
    'Travel', 'Training', 'Software', 'Infrastructure',
    'Events', 'Research', 'Consultancy', 'Other'
  )),
  sub_category TEXT,
  
  -- Description
  description TEXT NOT NULL,
  purpose TEXT,
  
  -- Invoice Details
  invoice_number TEXT,
  invoice_date DATE,
  invoice_file_id TEXT, -- File storage reference
  invoice_url TEXT,
  
  -- Payment Details
  payment_mode TEXT CHECK (payment_mode IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card', 'dd')),
  payment_reference TEXT,
  payment_date DATE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'cancelled')),
  
  -- Approval Workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'paid')),
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approval_remarks TEXT,
  rejected_reason TEXT,
  
  -- Budget Override
  is_override BOOLEAN DEFAULT FALSE, -- Exceeds budget allocation
  override_reason TEXT,
  override_approved_by UUID REFERENCES users(id),
  override_approved_at TIMESTAMPTZ,
  
  -- Reimbursement
  is_reimbursement BOOLEAN DEFAULT FALSE,
  reimbursement_to UUID REFERENCES users(id),
  reimbursement_status TEXT CHECK (reimbursement_status IN ('pending', 'processed', 'paid')),
  
  -- Attachments
  attachments JSONB DEFAULT '[]', -- Array of file references
  
  -- Remarks
  remarks TEXT,
  
  -- Recorded By
  recorded_by UUID NOT NULL REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_expenditure_amounts CHECK (
    amount >= 0 AND 
    tax_amount >= 0
  ),
  CONSTRAINT valid_payment_date CHECK (
    payment_date IS NULL OR payment_date >= expenditure_date
  )
);

-- Indexes for expenditures
CREATE INDEX idx_expenditures_department ON expenditures(department_id);
CREATE INDEX idx_expenditures_budget ON expenditures(budget_id);
CREATE INDEX idx_expenditures_number ON expenditures(expenditure_number);
CREATE INDEX idx_expenditures_date ON expenditures(expenditure_date);
CREATE INDEX idx_expenditures_category ON expenditures(category);
CREATE INDEX idx_expenditures_status ON expenditures(status);
CREATE INDEX idx_expenditures_payment_status ON expenditures(payment_status);
CREATE INDEX idx_expenditures_vendor ON expenditures(vendor_name);
CREATE INDEX idx_expenditures_override ON expenditures(is_override);

-- =====================================================
-- 3. BUDGET REVISIONS TABLE
-- Purpose: Track budget revision history
-- =====================================================
CREATE TABLE IF NOT EXISTS budget_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Budget Reference
  budget_id UUID NOT NULL REFERENCES department_budgets(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id),
  
  -- Revision Details
  revision_number INTEGER NOT NULL,
  revision_type TEXT NOT NULL CHECK (revision_type IN ('increase', 'decrease', 'reallocation', 'correction')),
  revision_reason TEXT NOT NULL,
  
  -- Changes
  previous_total DECIMAL(12,2) NOT NULL,
  new_total DECIMAL(12,2) NOT NULL,
  difference DECIMAL(12,2) GENERATED ALWAYS AS (new_total - previous_total) STORED,
  
  -- Budget Head Changes (JSONB)
  previous_heads JSONB NOT NULL,
  new_heads JSONB NOT NULL,
  
  -- Approval
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approval_remarks TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for budget_revisions
CREATE INDEX idx_budget_revisions_budget ON budget_revisions(budget_id);
CREATE INDEX idx_budget_revisions_department ON budget_revisions(department_id);
CREATE INDEX idx_budget_revisions_status ON budget_revisions(approval_status);
CREATE INDEX idx_budget_revisions_date ON budget_revisions(requested_at);

-- =====================================================
-- 4. BUDGET ALERTS TABLE
-- Purpose: Track budget utilization alerts
-- =====================================================
CREATE TABLE IF NOT EXISTS budget_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Budget Reference
  budget_id UUID NOT NULL REFERENCES department_budgets(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id),
  budget_head_name TEXT,
  
  -- Alert Details
  alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold_reached', 'budget_exceeded', 'low_balance', 'overspending')),
  alert_level TEXT NOT NULL CHECK (alert_level IN ('info', 'warning', 'critical')),
  
  -- Metrics
  allocated_amount DECIMAL(12,2) NOT NULL,
  spent_amount DECIMAL(12,2) NOT NULL,
  remaining_amount DECIMAL(12,2) NOT NULL,
  utilization_percentage DECIMAL(5,2) NOT NULL,
  
  -- Message
  alert_message TEXT NOT NULL,
  
  -- Notification
  notified_users UUID[] DEFAULT '{}',
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,
  
  -- Status
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for budget_alerts
CREATE INDEX idx_budget_alerts_budget ON budget_alerts(budget_id);
CREATE INDEX idx_budget_alerts_department ON budget_alerts(department_id);
CREATE INDEX idx_budget_alerts_type ON budget_alerts(alert_type);
CREATE INDEX idx_budget_alerts_level ON budget_alerts(alert_level);
CREATE INDEX idx_budget_alerts_acknowledged ON budget_alerts(is_acknowledged);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE TRIGGER update_department_budgets_updated_at BEFORE UPDATE ON department_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenditures_updated_at BEFORE UPDATE ON expenditures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Update budget spent amount on expenditure
-- =====================================================
CREATE OR REPLACE FUNCTION update_budget_on_expenditure()
RETURNS TRIGGER AS $$
DECLARE
  budget_head_index INTEGER;
  current_heads JSONB;
  updated_heads JSONB;
BEGIN
  -- Only update when expenditure is approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Update total spent in budget
    UPDATE department_budgets
    SET total_spent = total_spent + NEW.total_amount
    WHERE id = NEW.budget_id;
    
    -- Update specific budget head
    SELECT budget_heads INTO current_heads
    FROM department_budgets
    WHERE id = NEW.budget_id;
    
    -- Find and update the specific budget head
    updated_heads := (
      SELECT jsonb_agg(
        CASE 
          WHEN elem->>'head' = NEW.budget_head_name 
          THEN jsonb_set(
            elem,
            '{spent}',
            to_jsonb(COALESCE((elem->>'spent')::numeric, 0) + NEW.total_amount)
          )
          ELSE elem
        END
      )
      FROM jsonb_array_elements(current_heads) elem
    );
    
    UPDATE department_budgets
    SET budget_heads = updated_heads
    WHERE id = NEW.budget_id;
    
    -- Check for budget alerts
    PERFORM check_budget_alerts(NEW.budget_id, NEW.budget_head_name);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_budget_on_expenditure
AFTER INSERT OR UPDATE ON expenditures
FOR EACH ROW
EXECUTE FUNCTION update_budget_on_expenditure();

-- =====================================================
-- FUNCTION: Check budget alerts
-- =====================================================
CREATE OR REPLACE FUNCTION check_budget_alerts(
  p_budget_id UUID,
  p_budget_head_name TEXT
)
RETURNS VOID AS $$
DECLARE
  v_budget RECORD;
  v_utilization DECIMAL(5,2);
  v_alert_threshold DECIMAL(5,2);
BEGIN
  -- Get budget details
  SELECT * INTO v_budget
  FROM department_budgets
  WHERE id = p_budget_id;
  
  -- Check overall utilization
  v_utilization := v_budget.utilization_percentage;
  v_alert_threshold := v_budget.alert_threshold_percentage;
  
  -- Create alert if threshold reached
  IF v_utilization >= v_alert_threshold AND NOT v_budget.alert_sent THEN
    INSERT INTO budget_alerts (
      budget_id,
      department_id,
      alert_type,
      alert_level,
      allocated_amount,
      spent_amount,
      remaining_amount,
      utilization_percentage,
      alert_message
    ) VALUES (
      p_budget_id,
      v_budget.department_id,
      'threshold_reached',
      CASE 
        WHEN v_utilization >= 95 THEN 'critical'
        WHEN v_utilization >= v_alert_threshold THEN 'warning'
        ELSE 'info'
      END,
      v_budget.total_allocated,
      v_budget.total_spent,
      v_budget.total_remaining,
      v_utilization,
      format('Budget utilization has reached %s%%. Allocated: %s, Spent: %s, Remaining: %s',
        v_utilization, v_budget.total_allocated, v_budget.total_spent, v_budget.total_remaining)
    );
    
    -- Mark alert as sent
    UPDATE department_budgets
    SET alert_sent = TRUE
    WHERE id = p_budget_id;
  END IF;
  
  -- Check for overspending
  IF v_budget.total_spent > v_budget.total_allocated THEN
    INSERT INTO budget_alerts (
      budget_id,
      department_id,
      alert_type,
      alert_level,
      allocated_amount,
      spent_amount,
      remaining_amount,
      utilization_percentage,
      alert_message
    ) VALUES (
      p_budget_id,
      v_budget.department_id,
      'budget_exceeded',
      'critical',
      v_budget.total_allocated,
      v_budget.total_spent,
      v_budget.total_remaining,
      v_utilization,
      format('Budget exceeded! Allocated: %s, Spent: %s, Overspent: %s',
        v_budget.total_allocated, v_budget.total_spent, 
        v_budget.total_spent - v_budget.total_allocated)
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE department_budgets IS 'Department budget allocation with approval workflow and utilization tracking';
COMMENT ON TABLE expenditures IS 'Department expenses with invoice management and approval workflow';
COMMENT ON TABLE budget_revisions IS 'Budget revision history and audit trail';
COMMENT ON TABLE budget_alerts IS 'Budget utilization alerts and notifications';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
