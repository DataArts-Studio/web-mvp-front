-- 테스트 케이스 첨부 버킷을 비공개로 바꾼다. 공개 버킷은 경로만 알면 누구나 파일을 받을 수 있다.
-- 앱은 권한 확인을 통과한 응답에만 만료되는 서명 URL 을 실어 보낸다 (service_role 로 발급).
-- 서명 URL 을 쓰는 앱 코드가 배포된 뒤에 적용해야 한다. 먼저 적용하면 공개 URL 을 만드는 이전 코드의 첨부가 깨진다.
UPDATE storage.buckets SET public = false WHERE id = 'test-attachments';
