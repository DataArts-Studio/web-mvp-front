import { cn } from '@testea/util';

type Props = {
  description: string;
  onDescriptionChange: (value: string) => void;
  language: 'ko' | 'en';
  onLanguageChange: (value: 'ko' | 'en') => void;
};

export const AiGenerateForm = ({
  description,
  onDescriptionChange,
  language,
  onLanguageChange,
}: Props) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-2">
      <label className="typo-label-heading text-text-2">기능 설명</label>
      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="테스트할 기능을 설명해주세요. 예: 사용자가 이메일과 비밀번호로 로그인할 수 있다. 비밀번호는 8자 이상이어야 하며..."
        rows={8}
        maxLength={3000}
        className="typo-body2-normal bg-bg-1 text-text-1 placeholder:text-text-4 rounded-3 border border-line-2 p-4 focus:outline-none focus:border-primary resize-none"
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
                  : 'bg-bg-3 text-text-3 hover:text-text-1',
              )}
            >
              {l === 'ko' ? '한국어' : 'English'}
            </button>
          ))}
        </div>
        <span className="typo-caption text-text-4">
          {description.length}/3,000
        </span>
      </div>
    </div>
  </div>
);
