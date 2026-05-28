import { cn } from '@testea/util';

type Props = {
  description: string;
  onDescriptionChange: (value: string) => void;
  language: 'ko' | 'en';
  onLanguageChange: (value: 'ko' | 'en') => void;
  /** 첨부가 있으면 요구사항 입력은 보조라 라벨·placeholder·필수성을 조정 */
  hasAttachment?: boolean;
};

export const RequirementAnalysisForm = ({
  description,
  onDescriptionChange,
  language,
  onLanguageChange,
  hasAttachment = false,
}: Props) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-2">
      <label className="typo-label-heading text-text-2">
        요구사항{hasAttachment ? ' (선택, 첨부 보조 설명)' : ''}
      </label>
      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder={
          hasAttachment
            ? '첨부 문서에 더하고 싶은 맥락이 있으면 입력하세요. (선택)'
            : '분석할 요구사항을 입력해주세요. 예: 사용자는 이메일로 회원가입하고, 가입 후 프로필을 설정할 수 있어야 한다. 비밀번호는...'
        }
        rows={8}
        maxLength={5000}
        className="typo-body2-normal bg-bg-1 text-text-1 placeholder:text-text-4 rounded-3 border-line-2 focus:border-primary resize-none border p-4 focus:outline-none"
        autoFocus
      />
      <div className="flex items-center justify-between">
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
        <span className="typo-caption text-text-4">{description.length}/5,000</span>
      </div>
    </div>
  </div>
);
