CREATE UNIQUE INDEX "project_automation_tokens_token_hash_unq" ON "project_automation_tokens" USING btree ("token_hash");--> statement-breakpoint
ALTER TABLE "test_case_runs" ADD CONSTRAINT "test_case_runs_result_source_check" CHECK ("test_case_runs"."result_source" in ('manual', 'auto'));--> statement-breakpoint
ALTER TABLE "project_automation_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_automation_tokens" FORCE ROW LEVEL SECURITY;