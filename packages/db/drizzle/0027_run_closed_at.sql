-- 06g: 미실행이 남은 실행을 사람이 직접 완료한 시각. 있으면 결과와 무관하게 완료로 본다.
ALTER TABLE "test_runs" ADD COLUMN "closed_at" timestamp with time zone;
