ALTER TABLE "ai_usage_logs" ADD COLUMN "attached_file_type" varchar(20);--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN "attached_file_size_bytes" integer;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN "attached_file_page_count" integer;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN "attached_file_char_count" integer;