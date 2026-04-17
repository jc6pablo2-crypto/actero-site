import { vi } from 'vitest';
process.env.PORTAL_JWT_SECRET = 'test-secret-never-used-in-prod-0000000000000000';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
vi.stubGlobal('fetch', vi.fn());
