# 블로그 콘텐츠 작성 가이드 (Phase 1)

이 디렉터리의 `*.md` 파일이 곧 `/blog/{slug}` 글이 됩니다. 파일명 = slug 입니다.
빌드 타임에 [`apps/web/src/shared/lib/posts.ts`](../../src/shared/lib/posts.ts) 가
frontmatter 를 Zod 로 검증하므로, 형식이 맞지 않으면 빌드가 실패합니다.

## frontmatter 필수 항목

```yaml
---
title: '글 제목 (1~120자)'
excerpt: '요약 (최대 200자, 선택)'
category: 'guide' # product | guide | release | notice
tags: ['QA', '테스트 케이스']
publishedAt: '2026-05-24' # YYYY-MM-DD
coverImage: '/blog/cover-example.png' # 선택, public/ 기준 절대경로
author: 'Testea Team'
draft: false # true 이면 빌드 산출물에서 제외
---
```

- `category` 는 `product`, `guide`, `release`, `notice` 중 하나
- `publishedAt` 이 미래(now 보다 큼)인 글은 자동으로 제외 (예약 발행은 Phase 2 에서 별도 처리)
- `draft: true` 인 글은 sitemap·RSS·라우트 산출물 어디에도 노출되지 않음

## 본문 작성

- GitHub-Flavored Markdown 지원 (표·체크박스·코드 펜스)
- 이미지는 `public/` 기준 절대경로(`/blog/xxx.png`)로 작성, `next/image` 가 처리
- h2·h3 헤딩은 자동으로 anchor id 가 부여되어 우측 TOC 에 노출

## Phase 2 전환 시

Phase 2(백오피스 + DB)로 옮길 때 이 디렉터리의 글은 마이그레이션 스크립트로
`blog_posts` 테이블에 적재합니다. 그 전까지는 PR 머지 = 발행입니다.
