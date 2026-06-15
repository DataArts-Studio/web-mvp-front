'use client';

import { useState } from 'react';

import {
  useCreateTargetSite,
  useDeleteTargetSite,
  useTargetSites,
  useUpdateTargetSite,
} from '@/features/target-sites';
import type { TargetSite, TargetSiteAuthSecret } from '@/features/target-sites';
import { DSButton, Dialog, DsInput, SettingsCard } from '@testea/ui';
import { Globe, Info, KeyRound, Loader2, Pencil, Plus, ShieldOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TargetSitesSectionProps {
  projectId: string;
}

// 폼에서 다루는 인증 입력 모드.
// - keep: 기존 시크릿 유지(수정 시 기본값). 등록 폼에는 없음.
// - set: username/password 로 새 시크릿 저장 또는 교체.
// - remove: 기존 시크릿 제거(수정 시에만 의미 있음).
type AuthMode = 'keep' | 'set' | 'remove';

interface DialogState {
  mode: 'create' | 'edit';
  target: TargetSite | null;
}

/**
 * 프로젝트 설정 화면의 "테스트 대상" 섹션 (#188).
 *
 * - 등록된 대상 목록(name, baseUrl, 인증 설정 여부 hasAuth 배지)
 * - 대상 추가/수정: 모달 폼. 인증은 username/password 로 입력하며 시크릿 평문은
 *   저장 후 다시 표시되지 않는다(hasAuth 만 노출).
 * - 수정 시 인증 모드: 유지(누락)/교체(객체)/제거(null) 를 라디오로 표현.
 * - 삭제: 확인 다이얼로그.
 *
 * dev DB 에 target_sites 테이블이 아직 없을 수 있어 조회 실패/빈 상태에서도
 * 화면이 깨지지 않도록 방어적으로 렌더한다.
 */
export const TargetSitesSection = ({ projectId }: TargetSitesSectionProps) => {
  const listQuery = useTargetSites(projectId);
  const createMutation = useCreateTargetSite(projectId);
  const updateMutation = useUpdateTargetSite(projectId);
  const deleteMutation = useDeleteTargetSite(projectId);

  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TargetSite | null>(null);

  const sites = listQuery.data?.success ? listQuery.data.data : [];
  const loadError = listQuery.data && !listQuery.data.success;

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(
      { projectId, targetSiteId: confirmDelete.id },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast.success('테스트 대상을 삭제했습니다.');
            setConfirmDelete(null);
          } else {
            toast.error(Object.values(result.errors).flat().join(', '));
          }
        },
      }
    );
  };

  return (
    <>
      <SettingsCard.Root>
        <SettingsCard.Header
          icon={<Globe className="h-5 w-5" />}
          title="테스트 대상"
          description="자동화 러너가 테스트를 실행할 대상 환경(base URL)과 로그인 인증 정보를 등록합니다."
        />
        <SettingsCard.Divider />

        <SettingsCard.Body className="flex flex-col gap-4">
          {/* 공개 접근 제약 안내 */}
          <div className="bg-bg-3 border-line-2 flex items-start gap-2.5 rounded-md border p-3">
            <Info className="text-text-3 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="typo-caption text-text-3 leading-relaxed">
              테스트 대상은 러너가 외부에서 접근 가능한 환경이어야 합니다. 공개 스테이징처럼 외부
              네트워크에서 도달 가능한 주소를 등록하세요. 로컬호스트나 사내망 전용 주소는 러너가
              접근할 수 없습니다.
            </p>
          </div>

          {/* 목록 */}
          {listQuery.isLoading && (
            <div className="text-text-3 flex items-center gap-2 py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="typo-caption">불러오는 중...</span>
            </div>
          )}

          {!listQuery.isLoading && loadError && (
            <div className="border-line-2 text-text-3 typo-caption rounded-md border border-dashed px-4 py-6 text-center">
              테스트 대상을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
            </div>
          )}

          {!listQuery.isLoading && !loadError && sites.length === 0 && (
            <div className="border-line-2 text-text-3 typo-caption rounded-md border border-dashed px-4 py-6 text-center">
              등록된 테스트 대상이 없습니다. 대상을 추가해 자동화 실행 환경을 지정하세요.
            </div>
          )}

          {!listQuery.isLoading && !loadError && sites.length > 0 && (
            <ul className="flex flex-col gap-2">
              {sites.map((site) => (
                <li
                  key={site.id}
                  className="border-line-2 bg-bg-2 flex items-center justify-between gap-3 rounded-md border px-4 py-3"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="typo-body2-heading text-text-1 truncate">{site.name}</span>
                      {site.hasAuth ? (
                        <span className="typo-caption text-primary bg-primary/10 inline-flex items-center gap-1 rounded-full px-2 py-0.5">
                          <KeyRound className="h-3 w-3" aria-hidden="true" />
                          인증 설정됨
                        </span>
                      ) : (
                        <span className="typo-caption text-text-4 bg-bg-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5">
                          <ShieldOff className="h-3 w-3" aria-hidden="true" />
                          인증 없음
                        </span>
                      )}
                    </div>
                    <span className="typo-caption text-text-3 truncate font-mono">
                      {site.baseUrl}
                    </span>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <DSButton
                      variant="ghost"
                      size="small"
                      onClick={() => setDialog({ mode: 'edit', target: site })}
                      aria-label={`${site.name} 수정`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </DSButton>
                    <DSButton
                      variant="ghost"
                      size="small"
                      onClick={() => setConfirmDelete(site)}
                      aria-label={`${site.name} 삭제`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </DSButton>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* 추가 버튼 */}
          <div className="flex justify-end">
            <DSButton
              variant="solid"
              size="small"
              onClick={() => setDialog({ mode: 'create', target: null })}
              className="shrink-0"
            >
              <span className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                대상 추가
              </span>
            </DSButton>
          </div>
        </SettingsCard.Body>
      </SettingsCard.Root>

      {/* 추가/수정 모달 */}
      {dialog && (
        <TargetSiteFormDialog
          key={dialog.target?.id ?? 'create'}
          projectId={projectId}
          mode={dialog.mode}
          target={dialog.target}
          isPending={dialog.mode === 'create' ? createMutation.isPending : updateMutation.isPending}
          onClose={() => setDialog(null)}
          onSubmitCreate={(payload, onDone) =>
            createMutation.mutate(payload, {
              onSuccess: (result) => {
                if (result.success) {
                  toast.success('테스트 대상을 등록했습니다.');
                  onDone();
                } else {
                  toast.error(Object.values(result.errors).flat().join(', '));
                }
              },
            })
          }
          onSubmitUpdate={(payload, onDone) =>
            updateMutation.mutate(payload, {
              onSuccess: (result) => {
                if (result.success) {
                  toast.success('테스트 대상을 수정했습니다.');
                  onDone();
                } else {
                  toast.error(Object.values(result.errors).flat().join(', '));
                }
              },
            })
          }
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      {confirmDelete && (
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Overlay
              className="animate-in fade-in"
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1010,
              }}
            />
            <Dialog.Content
              className="bg-bg-2 w-full max-w-md rounded-2xl p-6 shadow-2xl"
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1011,
                outline: 'none',
              }}
            >
              <div className="flex flex-col gap-4">
                <Dialog.Title className="typo-h2-heading text-text-1">
                  테스트 대상을 삭제할까요?
                </Dialog.Title>
                <Dialog.Description className="typo-body2-normal text-text-3">
                  <strong className="text-text-1">{confirmDelete.name}</strong> 대상과 저장된 인증
                  정보가 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </Dialog.Description>
                <div className="flex justify-end gap-2">
                  <DSButton
                    variant="ghost"
                    size="small"
                    onClick={() => setConfirmDelete(null)}
                    disabled={deleteMutation.isPending}
                  >
                    취소
                  </DSButton>
                  <DSButton
                    variant="text"
                    size="small"
                    className="bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        삭제 중...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Trash2 className="h-3.5 w-3.5" />
                        삭제
                      </span>
                    )}
                  </DSButton>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
};

// ─── Form Dialog ─────────────────────────────────────────────────────────────

interface TargetSiteFormDialogProps {
  projectId: string;
  mode: 'create' | 'edit';
  target: TargetSite | null;
  isPending: boolean;
  onClose: () => void;
  onSubmitCreate: (
    payload: { projectId: string; name: string; baseUrl: string; auth?: TargetSiteAuthSecret },
    onDone: () => void
  ) => void;
  onSubmitUpdate: (
    payload: {
      projectId: string;
      targetSiteId: string;
      name?: string;
      baseUrl?: string;
      auth?: TargetSiteAuthSecret | null;
    },
    onDone: () => void
  ) => void;
}

const TargetSiteFormDialog = ({
  projectId,
  mode,
  target,
  isPending,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: TargetSiteFormDialogProps) => {
  const [name, setName] = useState(target?.name ?? '');
  const [baseUrl, setBaseUrl] = useState(target?.baseUrl ?? '');
  // 등록: 인증 입력이 없으면 'keep'(=auth 미전송, 인증 없음으로 저장).
  // 수정: 기존 인증이 있으면 기본 'keep'(유지), 없으면 'keep'(그대로 없음).
  const [authMode, setAuthMode] = useState<AuthMode>('keep');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const isEdit = mode === 'edit';
  const trimmedName = name.trim();
  const trimmedBaseUrl = baseUrl.trim();
  const canSubmit = trimmedName.length > 0 && trimmedBaseUrl.length > 0 && !isPending;

  // 'set' 모드인데 username/password 둘 다 비면 의미 없는 빈 시크릿이라 막는다.
  const setModeEmpty = authMode === 'set' && !username.trim() && !password.trim();

  const buildAuthSecret = (): TargetSiteAuthSecret => {
    const secret: TargetSiteAuthSecret = {};
    if (username.trim()) secret.username = username.trim();
    if (password) secret.password = password;
    return secret;
  };

  const handleSubmit = () => {
    if (!canSubmit || setModeEmpty) return;

    if (mode === 'create') {
      const auth = authMode === 'set' ? buildAuthSecret() : undefined;
      onSubmitCreate(
        {
          projectId,
          name: trimmedName,
          baseUrl: trimmedBaseUrl,
          ...(auth ? { auth } : {}),
        },
        onClose
      );
      return;
    }

    if (!target) return;
    // auth 의도: keep=키 누락(유지), remove=null(제거), set=객체(교체)
    let auth: TargetSiteAuthSecret | null | undefined;
    if (authMode === 'remove') auth = null;
    else if (authMode === 'set') auth = buildAuthSecret();
    else auth = undefined;

    onSubmitUpdate(
      {
        projectId,
        targetSiteId: target.id,
        name: trimmedName,
        baseUrl: trimmedBaseUrl,
        // auth 키 자체를 조건부로 넣어 'keep' 일 때는 전송하지 않는다.
        ...(auth === undefined ? {} : { auth }),
      },
      onClose
    );
  };

  return (
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Overlay
          className="animate-in fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1010,
          }}
        />
        <Dialog.Content
          className="bg-bg-2 w-full max-w-lg rounded-2xl p-6 shadow-2xl"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1011,
            outline: 'none',
          }}
        >
          <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto">
            <Dialog.Title className="typo-h2-heading text-text-1">
              {isEdit ? '테스트 대상 수정' : '테스트 대상 추가'}
            </Dialog.Title>

            {/* 이름 */}
            <label className="flex flex-col gap-1.5">
              <span className="typo-caption text-text-2">대상 이름</span>
              <DsInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 스테이징 환경"
                autoFocus
              />
            </label>

            {/* base URL */}
            <label className="flex flex-col gap-1.5">
              <span className="typo-caption text-text-2">Base URL</span>
              <DsInput
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://staging.example.com"
              />
              <span className="typo-caption text-text-4">
                http 또는 https 로 시작하는 외부 접근 가능한 주소를 입력하세요.
              </span>
            </label>

            {/* 인증 */}
            <div className="border-line-2 flex flex-col gap-3 border-t pt-4">
              <div className="flex flex-col gap-1">
                <span className="typo-body2-heading text-text-1">로그인 인증 (선택)</span>
                <span className="typo-caption text-text-4">
                  저장된 시크릿은 보안상 다시 표시되지 않습니다. 변경하려면 새 값을 입력하세요.
                </span>
              </div>

              {isEdit && (
                <div className="bg-bg-3 border-line-2 typo-caption text-text-3 flex items-center gap-2 rounded-md border px-3 py-2">
                  {target?.hasAuth ? (
                    <>
                      <KeyRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      현재 인증 정보가 저장되어 있습니다.
                    </>
                  ) : (
                    <>
                      <ShieldOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      현재 저장된 인증 정보가 없습니다.
                    </>
                  )}
                </div>
              )}

              {/* 인증 모드 선택 */}
              <div className="flex flex-col gap-2">
                <AuthModeOption
                  checked={authMode === 'keep'}
                  onChange={() => setAuthMode('keep')}
                  label={
                    isEdit
                      ? target?.hasAuth
                        ? '기존 인증 정보 유지'
                        : '인증 없이 유지'
                      : '인증 없이 등록'
                  }
                />
                <AuthModeOption
                  checked={authMode === 'set'}
                  onChange={() => setAuthMode('set')}
                  label={isEdit ? '인증 정보 새로 설정 / 교체' : '로그인 인증 추가'}
                />
                {isEdit && target?.hasAuth && (
                  <AuthModeOption
                    checked={authMode === 'remove'}
                    onChange={() => setAuthMode('remove')}
                    label="저장된 인증 정보 제거"
                  />
                )}
              </div>

              {authMode === 'set' && (
                <div className="flex flex-col gap-3 pl-6">
                  <label className="flex flex-col gap-1.5">
                    <span className="typo-caption text-text-2">사용자명</span>
                    <DsInput
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      autoComplete="off"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="typo-caption text-text-2">비밀번호</span>
                    <DsInput
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="password"
                      autoComplete="new-password"
                    />
                  </label>
                  {setModeEmpty && (
                    <span className="typo-caption text-red-400">
                      사용자명 또는 비밀번호 중 하나 이상을 입력하세요.
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <DSButton variant="ghost" size="small" onClick={onClose} disabled={isPending}>
                취소
              </DSButton>
              <DSButton
                variant="solid"
                size="small"
                onClick={handleSubmit}
                disabled={!canSubmit || setModeEmpty}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    저장 중...
                  </span>
                ) : isEdit ? (
                  '저장'
                ) : (
                  '추가'
                )}
              </DSButton>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// ─── Auth Mode Radio ─────────────────────────────────────────────────────────

const AuthModeOption = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) => (
  <label className="flex cursor-pointer items-center gap-2">
    <input
      type="radio"
      checked={checked}
      onChange={onChange}
      className="accent-primary h-3.5 w-3.5"
    />
    <span className="typo-caption text-text-2">{label}</span>
  </label>
);
