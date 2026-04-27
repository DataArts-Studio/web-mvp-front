import { defineConfig } from 'drizzle-kit';

const dbUrl = process.env.SUPABASE_DB_URL!;
const urlWithSsl = dbUrl.includes('?') ? `${dbUrl}&sslmode=require` : `${dbUrl}?sslmode=require`;

export default defineConfig({
  schema: './src/shared/lib/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: urlWithSsl,
  },
});
