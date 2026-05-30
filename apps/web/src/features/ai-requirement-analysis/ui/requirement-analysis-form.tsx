import { PromptTextarea } from '@/shared/ui';
import { cn } from '@testea/util';

type Props = {
  description: string;
  onDescriptionChange: (value: string) => void;
  language: 'ko' | 'en';
  onLanguageChange: (value: 'ko' | 'en') => void;
  /** 첨부가 있으면 요구사항 입력은 보조라 라벨·placeholder·필수성을 조정 */
  hasAttachment?: boolean;
  /** Cmd/Ctrl+Enter 제출 핸들러 (모달에서 분석 트리거) */
  onSubmit?: () => void;
};

export const RequirementAnalysisForm = ({
  description,
  onDescriptionChange,
  language,
  onLanguageChange,
  hasAttachment = false,
  onSubmit,
}: Props) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-2">
      <label className="typo-label-heading text-text-2">
        요구사항{hasAttachment ? ' (선택, 첨부 보조 설명)' : ''}
      </label>
      <PromptTextarea
        value={description}
        onValueChange={onDescriptionChange}
        onSubmit={onSubmit}
        placeholder={
          hasAttachment
            ? '첨부 문서에 더하고 싶은 맥락이 있으면 입력하세요. (선택)'
            : '분석할 요구사항을 입력해주세요. 예: 사용자는 이메일로 회원가입하고, 가입 후 프로필을 설정할 수 있어야 한다. 비밀번호는...'
        }
        minLength={hasAttachment ? undefined : 20}
        maxLength={5000}
        aria-label="요구사항 입력"
        autoFocus
      />
      <div className="flex items-center gap-2">
        <span className="typo-caption text-text-4">생성 언어:</span>
        {(['ko', 'en'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onLanguageChange(l)}
            className={cn(
              'typo-caption rounded-full px-2.5 py-0.5 transition-colors',
              language === l
                ? 'bg-primary/10 text-primary'
                : 'bg-bg-3 text-text-3 hover:text-text-1'
            )}
          >
            {l === 'ko' ? '한국어' : 'English'}
          </button>
        ))}
      </div>
    </div>
  </div>
);
