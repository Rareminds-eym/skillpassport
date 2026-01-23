# User Details Fix for Subscription Activation

## Error
```
null value in column "full_name" of relation "subscriptions" violates not-null constraint
```

## Root Cause

The `PaymentSuccess` page was trying to get user details from the `user` object (from `useAuth()`), but since the user doesn't have a valid session (email not confirmed), the `user` object is null.

This resulted in:
- `name: user?.user_metadata?.full_name || user?.email` → `undefined`
- `email: user?.email` → `undefined`

## The Problem

```javascript
// ❌ WRONG - user is null when no session
userDetails: {
  name: user?.user_metadata?.full_name || user?.email,  // undefined
  email: user?.email,  // undefined
  phone: user?.user_metadata?.phone,  // undefined
  studentType: planDetails?.studentType || 'student'
}
```

## The Solution

### Part 1: Return User Details from Payment Verification

Modified the Edge Function to return `user_name` and `user_email` from the order record.

**File**: `supabase/functions/verify-payment/index.ts`

```typescript
return new Response(
  JSON.stringify({
    success: true,
    verified: true,
    message: "Payment verified successfully",
    payment_id: razorpay_payment_id,
    order_id: razorpay_order_id,
    user_id: userId,
    user_name: order.user_name,      // ✅ Added
    user_email: order.user_email,    // ✅ Added
    payment_method: paymentMethod,
    amount: paymentAmount,
  }),
  { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
);
```

### Part 2: Use Transaction Details in PaymentSuccess

Modified `PaymentSuccess.jsx` to use user details from `transactionDetails` (which comes from payment verification).

**File**: `src/pages/subscription/PaymentSuccess.jsx`

```javascript
// ✅ CORRECT - Use details from transaction, fallback to user if available
userDetails: {
  name: transactionDetails?.user_name || user?.user_metadata?.full_name || user?.email || 'User',
  email: transactionDetails?.user_email || user?.email || '',
  phone: user?.user_metadata?.phone || null,
  studentType: planDetails?.studentType || 'student'
}
```

## Data Flow

```
1. User signs up
   ↓
2. Payment initiated
   - Order created with user_name and user_email
   - Stored in razorpay_orders table
   ↓
3. Payment completed
   ↓
4. Payment verification
   - Looks up order
   - Returns: { user_id, user_name, user_email, ... }
   ↓
5. Subscription activation
   - Uses user_name from transactionDetails
   - Uses user_email from transactionDetails
   - Creates subscription record ✅
```

## Where User Details Come From

### During Order Creation
**File**: `supabase/functions/create-razorpay-order/index.ts`

```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Call Supabase Edge Function to create Razorpay order
const response = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    amount: parseFloat(plan.price) * 100,
    currency: 'INR',
    planId: plan.id,
    planName: plan.name,
    userEmail: userDetails.email,    // From signup form
    userName: userDetails.name,      // From signup form
  }),
});
```

The Edge Function stores these in the database:
```typescript
await supabase
  .from('razorpay_orders')
  .insert({
    user_id: user.id,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    user_email: userEmail,  // ✅ Stored
    user_name: userName,    // ✅ Stored
    // ...
  });
```

## Fallback Chain

The code now has a robust fallback chain:

```javascript
name: 
  transactionDetails?.user_name          // 1st: From payment verification
  || user?.user_metadata?.full_name      // 2nd: From authenticated user
  || user?.email                         // 3rd: Use email as name
  || 'User'                              // 4th: Default fallback

email:
  transactionDetails?.user_email         // 1st: From payment verification
  || user?.email                         // 2nd: From authenticated user
  || ''                                  // 3rd: Empty string (will fail validation)
```

## Files Modified

1. **supabase/functions/verify-payment/index.ts**
   - Return `user_name` and `user_email` from order record

2. **src/pages/subscription/PaymentSuccess.jsx**
   - Use `transactionDetails` for user details
   - Fallback to `user` object if available
   - Provide sensible defaults

## Testing

After this fix:
- ✅ User details are available even without session
- ✅ Subscription record is created with correct name and email
- ✅ Works with authenticated users (backward compatible)
- ✅ Works without authenticated users (new flow)

## Database Constraints Satisfied

The `subscriptions` table requires:
- `full_name` NOT NULL ✅ Now provided from order
- `email` NOT NULL ✅ Now provided from order
- `user_id` NOT NULL ✅ Already provided from verification
- `plan_type` NOT NULL ✅ From plan details
- `plan_amount` NOT NULL ✅ From plan details
- `billing_cycle` NOT NULL ✅ From plan details
