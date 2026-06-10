/** Minimum password length — must match sso-worker and frontend constants */
export const PASSWORD_MIN = 10;

/** Maximum password length — bcrypt silently truncates at 72 bytes */
export const PASSWORD_MAX = 72;
