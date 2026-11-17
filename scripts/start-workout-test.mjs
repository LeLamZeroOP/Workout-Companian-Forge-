import { createServer } from 'vite';

// Explicit environment overrides also take precedence over any configured .env files.
process.env.VITE_SUPABASE_URL = '';
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = '';
const server = await createServer({
  server: { host: '127.0.0.1', port: 4180, strictPort: true },
});
await server.listen();
server.printUrls();
console.log('Workout editing test version — local storage only, cloud sync disabled.');
