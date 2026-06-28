'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 채팅 샌드박스 (테스트 대상).
 *
 * - 전송: 입력 후 전송 → 내 메시지가 목록 끝에 추가되고 입력창이 비워진다.
 * - 빈 메시지(공백만)는 전송되지 않는다.
 * - 전송 후 약 700ms 뒤 상대(봇) 자동 응답이 추가된다(비동기 대기 연습).
 * - Enter 로도 전송된다.
 */

type Sender = 'me' | 'bot';
interface Message {
  id: number;
  sender: Sender;
  text: string;
}

let seq = 1;
const next = () => (seq += 1);

const botReply = (text: string) =>
  text.includes('?') ? '좋은 질문이에요. 직접 테스트해 보세요!' : `"${text}" 잘 받았습니다 👍`;

export const ChatRoomSandbox = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'bot', text: '안녕하세요! 무엇이든 입력해 보세요.' },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: next(), sender: 'me', text }]);
    setInput('');
    setTimeout(() => {
      setMessages((m) => [...m, { id: next(), sender: 'bot', text: botReply(text) }]);
    }, 700);
  };

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 flex h-[32rem] w-full max-w-md flex-col rounded-2xl border">
        <div className="border-line-2 border-b px-5 py-3">
          <h1 className="text-base font-bold">QA 봇과 대화</h1>
        </div>

        <div
          ref={listRef}
          data-testid="message-list"
          className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              data-testid="message-item"
              data-sender={m.sender}
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                m.sender === 'me'
                  ? 'bg-primary self-end text-white'
                  : 'bg-bg-3 text-text-1 self-start'
              }`}
            >
              {m.sender === 'bot' ? (
                <span data-testid="bot-message">{m.text}</span>
              ) : (
                <span>{m.text}</span>
              )}
            </div>
          ))}
        </div>

        <div className="border-line-2 flex gap-2 border-t px-3 py-3">
          <input
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="메시지를 입력하세요"
            className="border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary h-button-md flex-1 border px-3 text-sm outline-none"
          />
          <button
            data-testid="chat-send"
            type="button"
            onClick={send}
            className="bg-primary rounded-button h-button-md hover:bg-primary/90 shrink-0 px-4 text-sm font-medium text-white transition-colors"
          >
            전송
          </button>
        </div>
      </div>
    </main>
  );
};
