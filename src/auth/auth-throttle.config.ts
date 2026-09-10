const configuredLimit = Number(process.env.AUTH_THROTTLE_LIMIT);

export const AUTH_THROTTLE_LIMIT =
  Number.isInteger(configuredLimit) && configuredLimit > 0
    ? configuredLimit
    : 5;
