const fs = require('fs');

// 1. organizationSubscriptionService.ts
const subServicePath = 'src/entities/organization/api/organizationSubscriptionService.ts';
let subService = fs.readFileSync(subServicePath, 'utf8');

subService = subService.replace(
  /async function authenticatedFetch\([^}]+\}[^}]+\}[^}]+\}/,
  `async function authenticatedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const origin = window.location.origin;
  return ssoClient.fetch(\`\${origin}\${path}\`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}`
);
fs.writeFileSync(subServicePath, subService);

// 2. organizationPaymentService.ts
const payServicePath = 'src/entities/organization/api/organizationPaymentService.ts';
let payService = fs.readFileSync(payServicePath, 'utf8');

payService = payService.replace(
  /const getAuthHeaders = async \(\) => \{[^}]+\}[^}]+\}[^}]+\};/,
  `const getAuthHeaders = async () => {
  return {
    'Content-Type': 'application/json',
  };
};`
);
payService = payService.replace(/fetch\(/g, 'ssoClient.fetch(');
fs.writeFileSync(payServicePath, payService);

// 3. organizationBillingService.ts
const billServicePath = 'src/entities/organization/api/organizationBillingService.ts';
let billService = fs.readFileSync(billServicePath, 'utf8');

billService = billService.replace(
  /const session = \{ access_token: ssoClient\.getAccessToken\(\), user: useAuthStore\.getState\(\)\.user \};\s*if\s*\(session\?\.access_token\)\s*\{\s*const origin = window\.location\.origin;\s*const res = await fetch\(([^,]+),\s*\{\s*headers:\s*\{\s*'Authorization': `Bearer \$\{session\.access_token\}`,\s*'Content-Type': 'application\/json'\s*\}\s*\}\s*\);/g,
  `const origin = window.location.origin;
        const res = await ssoClient.fetch($1, {
          headers: {
            'Content-Type': 'application/json'
          }
        });`
);

billService = billService.replace(
  /const session = \{ access_token: ssoClient\.getAccessToken\(\), user: useAuthStore\.getState\(\)\.user \};\s*if\s*\(!session\?\.access_token\)\s*throw new Error\('Not authenticated'\);\s*const origin = window\.location\.origin;\s*const res = await fetch\(([^,]+),\s*\{\s*headers:\s*\{\s*'Authorization': `Bearer \$\{session\.access_token\}`,\s*'Content-Type': 'application\/json'\s*\}\s*\}\s*\);/g,
  `const origin = window.location.origin;
        const res = await ssoClient.fetch($1, {
          headers: {
            'Content-Type': 'application/json'
          }
        });`
);

billService = billService.replace(
  /const session = \{ access_token: ssoClient\.getAccessToken\(\), user: useAuthStore\.getState\(\)\.user \};\s*if\s*\(!session\?\.access_token\)\s*\{\s*throw new Error\('Not authenticated'\);\s*\}\s*const origin = window\.location\.origin;\s*const response = await fetch\(([^,]+),\s*\{\s*method:\s*'GET',\s*headers:\s*\{\s*'Authorization': `Bearer \$\{session\.access_token\}`,\s*'Content-Type': 'application\/json'\s*\}\s*\}\s*\);/g,
  `const origin = window.location.origin;
      const response = await ssoClient.fetch($1, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });`
);

fs.writeFileSync(billServicePath, billService);

console.log('Fixed B2B organization services');
