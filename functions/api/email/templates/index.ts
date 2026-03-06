/**
 * Email HTML templates
 */

export function invitationTemplate(variables: {
  organizationName: string;
  memberType: string;
  invitationLink: string;
  expiresAt: string;
  customMessage?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">You're Invited!</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">You've been invited to join <strong>${variables.organizationName}</strong> as a <strong>${variables.memberType}</strong>.</p>
    
    ${variables.customMessage ? `<p style="font-size: 14px; color: #666; padding: 15px; background: white; border-left: 4px solid #667eea; margin: 20px 0;">${variables.customMessage}</p>` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${variables.invitationLink}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Accept Invitation</a>
    </div>
    
    <p style="font-size: 13px; color: #666;">This invitation expires on ${new Date(variables.expiresAt).toLocaleDateString()}.</p>
    
    <p style="font-size: 12px; color: #999; margin-top: 30px;">If you didn't expect this invitation, you can safely ignore this email.</p>
  </div>
</body>
</html>
  `.trim();
}

export function countdownTemplate(variables: {
  fullName: string;
  countdownDay: number;
  launchDate: string;
  registrationLink: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 48px;">${variables.countdownDay}</h1>
    <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Days Until Launch!</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hi ${variables.fullName},</p>
    
    <p style="font-size: 16px;">We're just <strong>${variables.countdownDay} days away</strong> from launching Skill Passport on <strong>${new Date(variables.launchDate).toLocaleDateString()}</strong>!</p>
    
    <p style="font-size: 16px;">Get ready to showcase your skills and achievements like never before.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${variables.registrationLink}" style="background: #f5576c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Complete Registration</a>
    </div>
    
    <p style="font-size: 14px; color: #666;">Stay tuned for more updates!</p>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>The Skill Passport Team</p>
  </div>
</body>
</html>
  `.trim();
}

export function otpTemplate(variables: {
  otp: string;
  name?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #2563eb; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Verification Code</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    ${variables.name ? `<p style="font-size: 16px;">Hi ${variables.name},</p>` : ''}
    
    <p style="font-size: 16px;">Your verification code is:</p>
    
    <div style="background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px dashed #2563eb;">
      <h2 style="color: #2563eb; margin: 0; font-size: 36px; letter-spacing: 8px;">${variables.otp}</h2>
    </div>
    
    <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
    
    <p style="font-size: 12px; color: #999; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
  </div>
</body>
</html>
  `.trim();
}

export function eventConfirmationTemplate(variables: {
  name: string;
  email: string;
  phone: string;
  amount: number;
  orderId: string;
  receiptLink: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #10b981; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Registration Confirmed! ✓</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hi ${variables.name},</p>
    
    <p style="font-size: 16px;">Thank you for registering! Your payment has been confirmed.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #10b981;">Registration Details</h3>
      <p style="margin: 8px 0;"><strong>Name:</strong> ${variables.name}</p>
      <p style="margin: 8px 0;"><strong>Email:</strong> ${variables.email}</p>
      <p style="margin: 8px 0;"><strong>Phone:</strong> ${variables.phone}</p>
      <p style="margin: 8px 0;"><strong>Amount Paid:</strong> ₹${variables.amount.toLocaleString()}</p>
      <p style="margin: 8px 0;"><strong>Order ID:</strong> ${variables.orderId}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${variables.receiptLink}" style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Download Receipt</a>
    </div>
    
    <p style="font-size: 14px; color: #666;">We'll send you more details about the event soon.</p>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>The Skill Passport Team</p>
  </div>
</body>
</html>
  `.trim();
}
