import { defineConfig } from 'drizzle-kit';

const dbUrl = process.env.SUPABASE_DB_URL!;
const urlWithSsl = dbUrl.includes('?') ? `${dbUrl}&sslmode=require` : `${dbUrl}?sslmode=require`;

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: urlWithSsl,
  },
});
