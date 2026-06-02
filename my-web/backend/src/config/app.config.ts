export const appConfig = () => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      'FATAL ERROR: JWT_SECRET is missing in environment configuration',
    );
  }

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    jwtSecret: jwtSecret,
    jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '1d',
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    cookieAccessMaxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
    cookieRefreshMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
    redisPassword: process.env.REDIS_PASSWORD || undefined,
    redisTtl: parseInt(process.env.REDIS_TTL || '86400', 10), // 1 day
  };
};
