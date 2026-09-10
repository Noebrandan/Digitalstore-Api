import { config } from 'dotenv';

process.env.NODE_ENV = 'test';
config({ path: '.env.test', override: true });
process.env.AUTH_THROTTLE_LIMIT = '100';
