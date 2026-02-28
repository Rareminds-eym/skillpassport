/**
 * Error Page Templates
 * 
 * HTML templates for user-friendly error pages
 */

/**
 * Generate device mismatch error page
 */
export function generateDeviceMismatchPage(reason: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Denied</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #fee;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }
    h1 {
      color: #1a202c;
      font-size: 24px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    p {
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .reason {
      background: #f7fafc;
      border-left: 4px solid #e53e3e;
      padding: 12px 16px;
      margin: 20px 0;
      text-align: left;
      border-radius: 4px;
      font-size: 14px;
      color: #2d3748;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      margin-top: 24px;
      transition: background 0.2s;
    }
    .button:hover {
      background: #5568d3;
    }
    .tips {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      text-align: left;
    }
    .tips h3 {
      font-size: 16px;
      color: #2d3748;
      margin-bottom: 12px;
    }
    .tips ul {
      list-style: none;
      padding: 0;
    }
    .tips li {
      padding: 8px 0;
      color: #4a5568;
      font-size: 14px;
      display: flex;
      align-items: start;
    }
    .tips li:before {
      content: "•";
      color: #667eea;
      font-weight: bold;
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔒</div>
    <h1>Access Denied</h1>
    <p>This content link can only be accessed from the device and browser where it was originally generated.</p>
    
    <div class="reason">
      <strong>Reason:</strong> ${escapeHtml(reason)}
    </div>
    
    <div class="tips">
      <h3>Why is this happening?</h3>
      <ul>
        <li>You're trying to access this link from a different browser or device</li>
        <li>You're using incognito/private browsing mode</li>
        <li>The link was shared from another user's account</li>
      </ul>
    </div>
    
    <div class="tips">
      <h3>How to fix this:</h3>
      <ul>
        <li>Go back to the course page and click the content again</li>
        <li>Use the same browser where you originally accessed the course</li>
        <li>Disable incognito/private mode</li>
      </ul>
    </div>
    
    <a href="/" class="button">Return to Course</a>
  </div>
</body>
</html>
  `;
}

/**
 * Generate token expired error page
 */
export function generateTokenExpiredPage(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Expired</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #fff5f5;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }
    h1 {
      color: #1a202c;
      font-size: 24px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    p {
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .button {
      display: inline-block;
      background: #f5576c;
      color: white;
      padding: 12px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      margin-top: 24px;
      transition: background 0.2s;
    }
    .button:hover {
      background: #e14658;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⏱️</div>
    <h1>Link Expired</h1>
    <p>This content link has expired for security reasons. Links are valid for 5 minutes.</p>
    <p>Please return to the course page and click the content again to generate a new link.</p>
    <a href="/" class="button">Return to Course</a>
  </div>
</body>
</html>
  `;
}

/**
 * Generate unauthorized access error page
 */
export function generateUnauthorizedPage(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unauthorized Access</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #fffbeb;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }
    h1 {
      color: #1a202c;
      font-size: 24px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    p {
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .button {
      display: inline-block;
      background: #fa709a;
      color: white;
      padding: 12px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      margin-top: 24px;
      transition: background 0.2s;
    }
    .button:hover {
      background: #e85d87;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🚫</div>
    <h1>Unauthorized Access</h1>
    <p>You don't have permission to access this content.</p>
    <p>Please make sure you're enrolled in the course and logged in with the correct account.</p>
    <a href="/" class="button">Return to Home</a>
  </div>
</body>
</html>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
