/**
 * Password reset email template with reset link
 */

export function generatePasswordResetTemplate(token, expiryMinutes = 30) {
  // Generate the reset link
  const resetLink = `http://localhost:3000/password-reset?token=${token}`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Link - Skill Passport</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f6f9fc;
            line-height: 1.6;
            color: #333;
        }
        .email-wrapper {
            background-color: #f6f9fc;
            padding: 20px 0;
            min-height: 100vh;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            border: 1px solid #e6ebf1;
        }
        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
            color: white;
            padding: 48px 40px;
            text-align: center;
            position: relative;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        }
        .logo {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 16px;
            position: relative;
            z-index: 1;
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            position: relative;
            z-index: 1;
        }
        .header p {
            margin: 12px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        .content {
            padding: 48px 40px;
        }
        .greeting {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 24px;
            font-weight: 500;
        }
        .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 32px;
            line-height: 1.7;
        }
        .reset-button-section {
            text-align: center;
            margin: 40px 0;
        }
        .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            text-decoration: none;
            padding: 18px 36px;
            border-radius: 12px;
            font-size: 18px;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
        }
        .reset-link-section {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
            text-align: center;
        }
        .reset-link-label {
            color: #6b7280;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .reset-link {
            word-break: break-all;
            color: #4f46e5;
            font-size: 14px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            background: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        .alert-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #f59e0b;
            border-radius: 12px;
            padding: 20px 24px;
            margin: 32px 0;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        .alert-icon {
            font-size: 20px;
            margin-top: 2px;
        }
        .alert-content {
            flex: 1;
        }
        .alert-title {
            font-weight: 700;
            color: #92400e;
            margin: 0 0 4px 0;
            font-size: 15px;
        }
        .alert-text {
            margin: 0;
            color: #92400e;
            font-size: 14px;
            line-height: 1.5;
        }
        .instructions {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 2px solid #3b82f6;
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
        }
        .instructions h3 {
            margin: 0 0 16px 0;
            color: #1e40af;
            font-size: 18px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .instructions ol {
            margin: 0;
            padding-left: 20px;
            color: #1e3a8a;
        }
        .instructions li {
            margin-bottom: 8px;
            font-size: 15px;
            line-height: 1.6;
        }
        .security-notice {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border: 2px solid #ef4444;
            border-radius: 12px;
            padding: 20px 24px;
            margin: 32px 0;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        .security-notice .alert-title {
            color: #991b1b;
        }
        .security-notice .alert-text {
            color: #991b1b;
        }
        .footer {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 32px 40px;
            text-align: center;
            border-top: 2px solid #e5e7eb;
        }
        .footer p {
            margin: 8px 0;
            color: #6b7280;
            font-size: 13px;
        }
        .footer .company {
            font-weight: 600;
            color: #374151;
        }
        .divider {
            height: 2px;
            background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
            margin: 32px 0;
        }
        @media (max-width: 600px) {
            .email-wrapper {
                padding: 10px;
            }
            .container {
                margin: 0;
                border-radius: 12px;
            }
            .header, .content, .footer {
                padding: 24px 20px;
            }
            .header h1 {
                font-size: 28px;
            }
            .reset-button {
                padding: 16px 28px;
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="logo">🛡️ Skill Passport</div>
                <h1>Reset Your Password</h1>
                <p>Secure access to your account</p>
            </div>

            <!-- Content -->
            <div class="content">
                <div class="greeting">Hello there! 👋</div>
                
                <div class="message">
                    We received a request to reset your password for your Skill Passport account. 
                    Click the button below to securely reset your password:
                </div>

                <!-- Reset Button -->
                <div class="reset-button-section">
                    <a href="${resetLink}" class="reset-button">
                        🔐 Reset My Password
                    </a>
                </div>

                <!-- Alternative Link -->
                <div class="reset-link-section">
                    <div class="reset-link-label">Or copy and paste this link:</div>
                    <div class="reset-link">${resetLink}</div>
                </div>

                <!-- Expiry Alert -->
                <div class="alert-box">
                    <div class="alert-icon">⏰</div>
                    <div class="alert-content">
                        <div class="alert-title">Time Sensitive</div>
                        <div class="alert-text">
                            This password reset link will expire in <strong>${expiryMinutes} minutes</strong>. 
                            Please complete your password reset as soon as possible.
                        </div>
                    </div>
                </div>

                <!-- Instructions -->
                <div class="instructions">
                    <h3>📋 How to reset your password:</h3>
                    <ol>
                        <li><strong>Click the "Reset My Password" button</strong> above or copy the link</li>
                        <li><strong>You'll be taken to a secure page</strong> to create your new password</li>
                        <li><strong>Enter your new password</strong> and confirm it</li>
                        <li><strong>Save your changes</strong> and log in with your new password</li>
                    </ol>
                </div>

                <div class="divider"></div>

                <!-- Security Notice -->
                <div class="security-notice">
                    <div class="alert-icon">🛡️</div>
                    <div class="alert-content">
                        <div class="alert-title">Security Notice</div>
                        <div class="alert-text">
                            If you didn't request this password reset, please ignore this email and your account will remain secure. 
                            Consider enabling two-factor authentication for additional security.
                        </div>
                    </div>
                </div>

                <div class="message">
                    If you're experiencing any issues or need assistance, please don't hesitate to contact our support team.
                </div>
                
                <div class="message">
                    Best regards,<br>
                    <strong>The Skill Passport Team</strong> 🚀
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p class="company">© ${new Date().getFullYear()} Skill Passport by RareMinds</p>
                <p>All rights reserved. This is an automated security email.</p>
                <p>Please do not reply to this message.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}