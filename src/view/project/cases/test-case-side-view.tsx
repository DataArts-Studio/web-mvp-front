import React from 'react';

import { DSButton } from '@/shared';
import { Clock, Calendar, Copy, Edit2, Flag, Folder, Play, Tag, Trash2, X } from 'lucide-react';

export const TestCaseSideView = () => {
  return (
    <section className="bg-bg-1 border-bg-4 fixed top-0 right-0 h-full w-[600px] translate-x-0 overflow-y-auto border-l p-4 transition-transform duration-300 ease-in-out">
      <header>
        <div>
          <DSButton>
            <X />
          </DSButton>
          <DSButton>
            <Edit2 />
            수정
          </DSButton>
        </div>
        <div>
          <span>TC-1001</span>
          <span>
            <Flag />
            badge
          </span>
          <span>badge</span>
        </div>
        {/*<p>회원가입 - 이메일 형식이 잘못된 경우</p>*/}
        <h2>회원가입 - 이메일 형식이 잘못된 경우</h2>
        <div>
          <div>
            <Folder />
            <span>Authentication / Login</span>
          </div>
          <div>
            <Calendar />
            <span>2025-12-13</span>
          </div>
        </div>
      </header>
      <div>
        <div>
          <h3>
            <Tag />
            Tags
          </h3>
          <span>smoke</span>
          <span>critical-path</span>
        </div>
        <div>
          <h3>전제 조건</h3>
          <div>
            <pre className="whitespace-pre-wrap">
              1.사용자가 브라우저(또는 앱)를 실행하여 회원가입 페이지에 접속해 있는 상태여야 한다.
              2.이미 가입된 이메일이 아닌, 새로운 정보를 입력하는 상황을 가정한다.
            </pre>
          </div>
        </div>
        <div>
          <h3>테스트 단계</h3>
          <div>
            <pre className="whitespace-pre-wrap">
              1. 이메일 입력 필드에 형식에 어긋나는 값(예: test@com, testId 등)을 입력한다. 2.
              비밀번호, 이름 등 나머지 필수 입력 필드에는 정상적인 값을 입력한다. 3. [회원가입 완료]
              버튼을 클릭한다.
            </pre>
          </div>
        </div>

        <div>
          <h3>예상 결과</h3>
          <div>
            <pre className="whitespace-pre-wrap">
              1. 가입 요청이 차단되어야 하며, 다음 단계로 넘어가지 않아야 한다. 2. "올바른 이메일
              형식을 입력해주세요." 와 같은 명확한 에러 메시지가 노출되어야 한다. 3. 이메일 입력란에
              포커스가 가거나 붉은색 테두리 등으로 강조되어야 한다.
            </pre>
          </div>
        </div>
      </div>
      <div>
        <div>
          <h3>테스트 종류</h3>
          <p>기능 동작</p>
        </div>
        <div>
          <h3>예상 소요 시간</h3>
          <p><Clock/>4m</p>
        </div>
      </div>
      <div>
        <DSButton>
          <Play />
          테스트 실행
        </DSButton>
        <DSButton>
          <Copy />
          Copy
        </DSButton>
        <DSButton>
          <Trash2 />
        </DSButton>
      </div>
    </section>
  );
};
