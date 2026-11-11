export function readVariable(text, key) {
  const line = text.split(/\r?\n/).find(value => value.startsWith(`${key}=`));
  return line?.slice(key.length + 1).trim().replace(/^(["'])(.*)\1$/, '$2') ?? '';
}

function setVariable(text, key, value) {
  const line = `${key}=${JSON.stringify(value)}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  return pattern.test(text) ? text.replace(pattern, () => line) : `${text.trimEnd()}\n${line}\n`;
}

/** Configure only an explicit local preview; never add a tunnel wildcard. */
export function configurePreview(appText, ssoText, origin) {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.origin !== origin || !/^[a-z0-9-]+\.trycloudflare\.com$/.test(url.hostname)) {
    throw new Error('Expected an exact HTTPS trycloudflare.com origin');
  }
  if (readVariable(appText, 'ENVIRONMENT') !== 'local' || readVariable(ssoText, 'ENVIRONMENT') !== 'local') {
    throw new Error('Both .dev.vars files must use ENVIRONMENT=local');
  }
  const previous = readVariable(appText, 'DEV_PUBLIC_ORIGIN');
  let app = setVariable(appText, 'DEV_PUBLIC_ORIGIN', origin);
  app = setVariable(app, 'APP_URL', origin);
  let sso = setVariable(ssoText, 'SKILLPASSPORT_URL', origin);
  for (const key of ['ALLOWED_ORIGINS', 'ALLOWED_APP_URLS']) {
    const origins = readVariable(ssoText, key).split(',').map(value => value.trim()).filter(Boolean)
      .filter(value => !previous || value !== previous);
    sso = setVariable(sso, key, [...new Set([...origins, origin])].join(','));
  }
  return { app, sso };
}
