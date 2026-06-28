'use client';

import { useState } from 'react';

/**
 * 할 일(Todo) CRUD 샌드박스 (테스트 대상).
 *
 * - 추가: 입력 후 추가 → 목록에 생기고 입력창이 비워진다. 공백만 입력하면 추가 안 됨.
 * - 완료 토글: 체크박스로 완료/미완료 전환(완료는 취소선).
 * - 수정: 수정 → 인라인 입력 → 저장.
 * - 삭제: 항목 제거.
 * - 필터: 전체 / 미완료 / 완료. 남은(미완료) 개수 표시.
 */

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

type Filter = 'all' | 'active' | 'done';

let seq = 3;

export const TodoListSandbox = () => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: '로그인 폼 테스트 케이스 작성', done: true },
    { id: 2, text: '결제 플로우 회귀 테스트', done: false },
  ]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const add = () => {
    const text = input.trim();
    if (!text) return;
    setTodos((ts) => [...ts, { id: (seq += 1), text, done: false }]);
    setInput('');
  };
  const toggle = (id: number) =>
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: number) => setTodos((ts) => ts.filter((t) => t.id !== id));
  const startEdit = (t: Todo) => {
    setEditingId(t.id);
    setEditText(t.text);
  };
  const saveEdit = () => {
    const text = editText.trim();
    if (text) setTodos((ts) => ts.map((t) => (t.id === editingId ? { ...t, text } : t)));
    setEditingId(null);
  };

  const visible = todos.filter((t) =>
    filter === 'active' ? !t.done : filter === 'done' ? t.done : true
  );
  const remaining = todos.filter((t) => !t.done).length;

  const tab = (f: Filter, label: string, testid: string) => (
    <button
      key={f}
      data-testid={testid}
      type="button"
      onClick={() => setFilter(f)}
      className={`rounded-button h-9 border px-3 text-sm transition-colors ${
        filter === f ? 'border-primary text-primary' : 'border-line-3 text-text-2 hover:text-text-1'
      }`}
    >
      {label}
    </button>
  );

  const fieldClass =
    'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary h-button-md border px-3 text-sm outline-none';

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-md rounded-2xl border p-8">
        <div className="mb-5 flex items-baseline justify-between">
          <h1 className="text-xl font-bold">할 일</h1>
          <span data-testid="remaining-count" className="text-text-3 text-sm">
            남은 일 {remaining}개
          </span>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            data-testid="todo-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="할 일을 입력하세요"
            className={`flex-1 ${fieldClass}`}
          />
          <button
            data-testid="todo-add"
            type="button"
            onClick={add}
            className="bg-primary rounded-button h-button-md hover:bg-primary/90 shrink-0 px-4 text-sm font-medium text-white transition-colors"
          >
            추가
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          {tab('all', '전체', 'filter-all')}
          {tab('active', '미완료', 'filter-active')}
          {tab('done', '완료', 'filter-done')}
        </div>

        <ul className="flex flex-col gap-2">
          {visible.map((t) => (
            <li
              key={t.id}
              data-testid="todo-item"
              className="border-line-2 bg-bg-1 flex items-center gap-2 rounded-xl border px-3 py-2"
            >
              <input
                data-testid="todo-toggle"
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t.id)}
                className="accent-primary h-4 w-4 shrink-0"
              />
              {editingId === t.id ? (
                <>
                  <input
                    data-testid="todo-edit-input"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    className={`min-w-0 flex-1 ${fieldClass} h-9`}
                  />
                  <button
                    data-testid="todo-save"
                    type="button"
                    onClick={saveEdit}
                    className="text-primary shrink-0 text-sm"
                  >
                    저장
                  </button>
                </>
              ) : (
                <>
                  <span
                    data-testid="todo-text"
                    className={`min-w-0 flex-1 truncate text-sm ${t.done ? 'text-text-3 line-through' : ''}`}
                  >
                    {t.text}
                  </span>
                  <button
                    data-testid="todo-edit"
                    type="button"
                    onClick={() => startEdit(t)}
                    className="text-text-3 hover:text-text-1 shrink-0 text-xs transition-colors"
                  >
                    수정
                  </button>
                  <button
                    data-testid="todo-delete"
                    type="button"
                    onClick={() => remove(t.id)}
                    className="text-text-3 hover:text-system-red shrink-0 text-xs transition-colors"
                  >
                    삭제
                  </button>
                </>
              )}
            </li>
          ))}
          {visible.length === 0 && (
            <li data-testid="empty-state" className="text-text-3 py-6 text-center text-sm">
              표시할 할 일이 없습니다.
            </li>
          )}
        </ul>
      </div>
    </main>
  );
};
