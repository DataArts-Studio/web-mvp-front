'use client';

import { type FormEvent, useMemo, useState } from 'react';

import { PlaygroundHeader } from '@/view/challenges/playground-header';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Edit3, MessageSquarePlus, Search, Trash2, X } from 'lucide-react';

type PostCategory = '전체' | '질문' | '풀이노트' | '자유';
type WritableCategory = Exclude<PostCategory, '전체'>;

type CommunityPost = {
  id: number;
  title: string;
  category: WritableCategory;
  content: string;
  comments: number;
  createdAt: string;
};

const CATEGORIES: { label: PostCategory; description: string }[] = [
  { label: '전체', description: '모든 커뮤니티 글' },
  { label: '질문', description: '막힌 부분을 묻고 답변받는 글' },
  { label: '풀이노트', description: '문제 풀이 과정과 회고' },
  { label: '자유', description: '테스트 경험과 가벼운 공유' },
];

const WRITE_CATEGORIES: WritableCategory[] = ['질문', '풀이노트', '자유'];

const emptyForm = {
  title: '',
  category: '질문' as WritableCategory,
  content: '',
};

export function CommunityView() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PostCategory>('전체');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showEditor, setShowEditor] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const filteredPosts = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory = category === '전체' || post.category === category;
      const matchesKeyword =
        keyword.length === 0 ||
        post.title.toLowerCase().includes(keyword) ||
        post.content.toLowerCase().includes(keyword);

      return matchesCategory && matchesKeyword;
    });
  }, [category, posts, query]);

  const fadeSlideIn = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 };
  const fadeSlideOut = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 };
  const fadeVisible = shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 };

  const resetEditor = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowEditor(false);
  };

  const handleCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowEditor(true);
  };

  const handleEdit = (post: CommunityPost) => {
    setEditingId(post.id);
    setForm({ title: post.title, category: post.category, content: post.content });
    setShowEditor(true);
  };

  const handleDelete = (postId: number) => {
    setPosts((current) => current.filter((post) => post.id !== postId));
    if (editingId === postId) resetEditor();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const content = form.content.trim();
    if (!title || !content) return;

    if (editingId != null) {
      setPosts((current) =>
        current.map((post) =>
          post.id === editingId ? { ...post, title, category: form.category, content } : post
        )
      );
      resetEditor();
      return;
    }

    setPosts((current) => [
      {
        id: Date.now(),
        title,
        category: form.category,
        content,
        comments: 0,
        createdAt: '방금 전',
      },
      ...current,
    ]);
    resetEditor();
  };

  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader containerClassName="max-w-6xl" />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6">
        <header className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-primary text-sm font-semibold">질문과 풀이 노트</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">커뮤니티</h1>
            <p className="text-text-2 mt-2 max-w-2xl text-sm">
              qaground 문제를 풀며 막힌 부분, 테스트 접근법, 풀이 회고를 공유합니다.
            </p>
          </div>
          <motion.button
            type="button"
            onClick={handleCreate}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center gap-2 px-5 text-sm font-semibold text-white transition-colors"
          >
            <MessageSquarePlus size={16} aria-hidden="true" />
            글쓰기
          </motion.button>
        </header>

        <div className="grid flex-1 items-stretch gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="border-line-2 bg-bg-2 min-h-[560px] rounded-lg border p-4 lg:sticky lg:top-20 lg:h-full">
            <h2 className="text-sm font-semibold">카테고리</h2>
            <nav className="mt-4 grid gap-1" aria-label="커뮤니티 카테고리">
              {CATEGORIES.map((item) => {
                const active = item.label === category;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setCategory(item.label)}
                    className={`rounded-md px-3 py-2 text-left transition-colors ${
                      active
                        ? 'bg-primary/15 text-primary'
                        : 'text-text-2 hover:bg-bg-3 hover:text-text-1'
                    }`}
                  >
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="mt-1 block text-xs opacity-75">{item.description}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="border-line-2 bg-bg-2 flex min-h-[560px] min-w-0 flex-col rounded-lg border p-4">
            <div>
              <label className="border-line-2 bg-bg-1 focus-within:border-primary/60 flex h-11 items-center gap-3 rounded-md border px-3 transition-colors">
                <Search className="text-text-3" size={17} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="제목, 내용 검색"
                  className="placeholder:text-text-3 text-text-1 h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
              <div className="text-text-3 mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span>
                  {category} · {filteredPosts.length}개 글
                </span>
                <span>현재 글은 이 브라우저 세션에서만 유지됩니다.</span>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showEditor ? (
                <motion.form
                  key="community-editor"
                  layout
                  initial={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.99 }
                  }
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  onSubmit={handleSubmit}
                  className="border-line-2 bg-bg-1 mt-4 rounded-lg border p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold">
                      {editingId == null ? '글 작성' : '글 수정'}
                    </h2>
                    <button
                      type="button"
                      onClick={resetEditor}
                      className="text-text-3 hover:text-text-1 inline-flex size-8 items-center justify-center rounded-md transition-colors"
                      aria-label="닫기"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          category: event.target.value as WritableCategory,
                        }))
                      }
                      className="border-line-2 bg-bg-2 text-text-1 h-10 rounded-md border px-3 text-sm outline-none"
                    >
                      {WRITE_CATEGORIES.map((item) => (
                        <option key={item} value={item} className="bg-bg-2 text-text-1">
                          {item}
                        </option>
                      ))}
                    </select>
                    <input
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder="제목"
                      className="border-line-2 bg-bg-2 placeholder:text-text-3 text-text-1 h-10 rounded-md border px-3 text-sm outline-none"
                    />
                  </div>
                  <textarea
                    value={form.content}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, content: event.target.value }))
                    }
                    placeholder="내용을 입력하세요."
                    className="border-line-2 bg-bg-2 placeholder:text-text-3 text-text-1 mt-3 min-h-32 w-full resize-y rounded-md border p-3 text-sm outline-none"
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={resetEditor}
                      className="border-line-2 text-text-2 hover:bg-bg-3 rounded-button h-button-md border px-4 text-sm transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={!form.title.trim() || !form.content.trim()}
                      className="bg-primary rounded-button h-button-md px-5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {editingId == null ? '등록' : '수정 완료'}
                    </button>
                  </div>
                </motion.form>
              ) : null}
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              {filteredPosts.length > 0 ? (
                <motion.ul
                  key="community-posts"
                  layout
                  initial={fadeSlideIn}
                  animate={fadeVisible}
                  exit={fadeSlideOut}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="divide-line-2 border-line-2 bg-bg-1 mt-4 divide-y overflow-hidden rounded-lg border"
                >
                  {filteredPosts.map((post) => (
                    <motion.li
                      key={post.id}
                      layout
                      initial={fadeSlideIn}
                      animate={fadeVisible}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="grid gap-3 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="border-line-2 text-text-2 w-fit rounded-full border px-2.5 py-1 text-xs">
                          {post.category}
                        </span>
                        <span className="text-text-3 text-xs">{post.createdAt}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{post.title}</p>
                        <p className="text-text-3 mt-2 line-clamp-2 text-xs leading-5">
                          {post.content}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-text-3 text-xs">댓글 {post.comments}개</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(post)}
                            className="text-text-2 hover:text-primary inline-flex size-8 items-center justify-center rounded-md transition-colors"
                            aria-label="글 수정"
                          >
                            <Edit3 size={15} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(post.id)}
                            className="text-text-2 inline-flex size-8 items-center justify-center rounded-md transition-colors hover:text-red-300"
                            aria-label="글 삭제"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (
                <motion.div
                  key="community-empty"
                  layout
                  initial={fadeSlideIn}
                  animate={fadeVisible}
                  exit={fadeSlideOut}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="border-line-2 bg-bg-1 mt-4 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center"
                >
                  <p className="text-sm font-medium">아직 게시글이 없습니다.</p>
                  <p className="text-text-3 mx-auto mt-2 max-w-md text-xs leading-5">
                    글쓰기 버튼으로 질문, 풀이노트, 자유 글을 작성해보세요.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>
    </div>
  );
}
