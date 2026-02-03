/**
 * SMTP configuration builder
 */

export function buildSmtpConfig(env) {
  const smtpHost = env.SMTP_HOST;
  const smtpPort = parseInt(env.SMTP_PORT || '587');
  const smtpUser = env.SMTP_USER;
  const smtpPass = env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('SMTP configuration missing. Please set SMTP_HOST, SMTP_USER, SMTP_PASS secrets.');
  }

  return {
    host: smtpHost,
    port: smtpPort,
    secure: false,
    startTls: true,
    authType: 'plain',
    credentials: {
      username: smtpUser,
      password: smtpPass,
    },
  };
}

export function getFromAddress(env, customFrom, customFromName) {
  const defaultFromEmail = env.FROM_EMAIL || 'noreply@rareminds.in';
  const defaultFromName = env.FROM_NAME || 'Skill Passport';

  return {
    email: customFrom || defaultFromEmail,
    name: customFromName || defaultFromName,
  };
}
