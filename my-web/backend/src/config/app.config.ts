export const appConfig = () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
});
