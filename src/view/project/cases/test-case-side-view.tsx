import React from 'react';

import { DSButton } from '@/shared';
import { Calendar, Clock, Copy, Edit2, Flag, Folder, Play, Tag, Trash2, X } from 'lucide-react';

export const TestCaseSideView = () => {
  return (
    <section className="bg-bg-1 border-bg-4 fixed top-0 right-0 h-full w-[600px] translate-x-0 overflow-y-auto border-l p-4 transition-transform duration-300 ease-in-out">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex justify-between">
            <DSButton size="small" variant="ghost" className="px-2">
              <X className="h-4 w-4" />
            </DSButton>
            <DSButton size="small" variant="ghost" className="flex items-center gap-1 px-2">
              <Edit2 className="h-4 w-4" />
              <span>수정</span>
            </DSButton>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary text-xl font-semibold">TC-1001</span>
            <span className="flex items-center gap-1">
              <Flag className="h-4 w-4" />
              badge
            </span>
            <span>badge</span>
          </div>
          {/*<p>회원가입 - 이메일 형식이 잘못된 경우</p>*/}
          <h2 className="text-xl">회원가입 - 이메일 형식이 잘못된 경우</h2>
          <div className="flex gap-2">
            <div className="text-text-3 flex items-center gap-1 text-sm">
              <Folder className="h-4 w-4" />
              <span>Authentication / Login</span>
            </div>
            <div className="text-text-3 flex items-center gap-1 text-sm">
              <Calendar className="h-4 w-4" />
              <span>2025-12-13</span>
            </div>
          </div>
        </header>
        {/* 태그 */}
        <div className="flex gap-2">
          <h3 className="text-text-3 flex items-center gap-1">
            <Tag className="h-4 w-4" />
            Tags
          </h3>
          <span>smoke</span>
          <span>critical-path</span>
        </div>
        {/* 사이드뷰 본문 */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-text-3 text-lg font-semibold">전제 조건</h3>
            <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
              <p>
                1. 사용자가 브라우저(또는 앱)를 실행하여 회원가입 페이지에 접속해 있는 상태여야
                한다.
              </p>
              <p>2. 이미 가입된 이메일이 아닌, 새로운 정보를 입력하는 상황을 가정한다.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-text-3 text-lg font-semibold">테스트 단계</h3>
            <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
              <p>1. 이메일 입력 필드에 형식에 어긋나는 값(예: test@com, testId 등)을 입력한다.</p>
              <p>2. 비밀번호, 이름 등 나머지 필수 입력 필드에는 정상적인 값을 입력한다.</p>
              <p>3. [회원가입 완료] 버튼을 클릭한다.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-text-3 text-lg font-semibold">예상 결과</h3>
            <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
              <p>1. 가입 요청이 차단되어야 하며, 다음 단계로 넘어가지 않아야 한다.</p>
              <p>2. "올바른 이메일형식을 입력해주세요." 와 같은 명확한 에러 메시지가 노출되어야 한다.</p>
              <p>3. 이메일입력란에 포커스가 가거나 붉은색 테두리 등으로 강조되어야 한다.</p>
            </div>
          </div>
        </div>
        {/* 테스트 정보 */}
        <div className="flex gap-2">
          <div className="bg-bg-2 border-line-2 rounded-4 flex-1 border p-4">
            <h3 className="text-text-3 mb-1">테스트 종류</h3>
            <p>기능 동작</p>
          </div>
          <div className="bg-bg-2 border-line-2 rounded-4 flex-1 border p-4">
            <h3 className="text-text-3 mb-1">예상 소요 시간</h3>
            <div className="flex items-center gap-2">
              <Clock className="text-primary h-4 w-4" />
              <span>4m</span>
            </div>
          </div>
        </div>
        {/* 테스트 실행 */}
        <div className="flex gap-2">
          <DSButton className="flex flex-1 items-center gap-2">
            <Play className="h-4 w-4" />
            테스트 실행
          </DSButton>
          <DSButton variant="ghost" className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Copy
          </DSButton>
          <DSButton variant="ghost" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
          </DSButton>
        </div>
      </div>
    </section>
  );
};
