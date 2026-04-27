type SuiteOption = {
  id: string;
  title: string;
};

type Props = {
  suiteId: string;
  onSuiteIdChange: (value: string) => void;
  suites: SuiteOption[];
};

export const AiSuiteSelector = ({ suiteId, onSuiteIdChange, suites }: Props) => (
  <div className="flex items-center gap-2">
    <span className="typo-caption text-text-3">스위트:</span>
    <select
      value={suiteId}
      onChange={(e) => onSuiteIdChange(e.target.value)}
      className="typo-caption bg-bg-1 text-text-1 border border-line-2 rounded-2 px-2 py-1 focus:outline-none"
    >
      <option value="">없음</option>
      {suites.map((s) => (
        <option key={s.id} value={s.id}>{s.title}</option>
      ))}
    </select>
  </div>
);
