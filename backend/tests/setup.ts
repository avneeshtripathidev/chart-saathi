// Test environment setup
// Provide minimal env vars so config validation passes during tests
process.env.PORT = '3001';
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.CHART_PROVIDER = 'mock';
process.env.CORS_ORIGINS = 'http://localhost:8081';
