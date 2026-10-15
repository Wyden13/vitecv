export const ROOT_ROUTE = '/';
export const HOME_ROUTE = '/dashboard';
export const LOGIN_ROUTE = '/login';

export const SESSION_COOKIE_NAME = 'user_session';

/**
 * Session lifetime. Firebase requires `createSessionCookie`'s `expiresIn` to be
 * between 5 minutes and 2 weeks, expressed in milliseconds.
 */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 5 * 1000; // 5 days
