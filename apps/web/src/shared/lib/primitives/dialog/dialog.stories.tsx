import React from 'react';



import { Dialog, type DialogContentProps, type DialogOverlayProps, type DialogRootProps, useDialog } from '@/shared/lib/primitives';
import type { Meta, StoryObj } from '@storybook/react';










// ------------------------------------------------------------------
// Meta 정의
// ------------------------------------------------------------------

// Storybook Controls에 노출할 Dialog.Root의 Props를 정의합니다.
type DialogRootOmittedProps = Omit<DialogRootProps, 'children'>;

const meta: Meta<DialogRootProps> = {
  title: 'Primitive Components/Dialog',
  component: Dialog.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // ------------------------------------------------------------------
    // 상태 속성 (State Props)
    // ------------------------------------------------------------------
    defaultOpen: {
      control: 'boolean',
      description: '다이얼로그의 **초기 열림 상태**를 지정합니다.',
      table: {
        category: 'Control',
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ------------------------------------------------------------------
// 재사용 가능한 템플릿 컴포넌트
// ------------------------------------------------------------------

/** DialogOverlay와 DialogContent의 기본 스타일을 설정합니다. */
const DefaultContentTemplate: React.FC<
  DialogOverlayProps & DialogContentProps & { children: React.ReactNode }
> = ({ children, style: contentStyle, ...props }) => (
  <Dialog.Portal>
    {/* Overlay: 배경 클릭 시 닫히도록 Dialog.Root에서 onClose를 자동으로 받습니다. */}
    <Dialog.Overlay
      className="dialog-overlay"
      style={{
        // 스토리북에서 인라인 스타일로 오버레이를 시각적으로 분리합니다.
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        transition: 'opacity 0.2s',
      }}
    />

    <Dialog.Content
      className="dialog-content"
      style={{
        width: '400px',
        maxWidth: '90vw',
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        ...contentStyle,
      }}
      {...props}
    >
      {children}
    </Dialog.Content>
  </Dialog.Portal>
);

// ------------------------------------------------------------------
// Stories 정의
// ------------------------------------------------------------------

/**
 * 기본 다이얼로그 (Default)
 * - Title, Description, Close Button을 포함한 표준 모달 구조
 */
export const DefaultDialog: Story = {
  args: {
    defaultOpen: false,
  },
  render: (args) => {
    // useDialog 훅을 사용하여 onOpen/onClose를 직접 제어할 수도 있습니다.
    return (
      <Dialog.Root {...args}>
        <Dialog.Trigger>
          <button
            style={{
              padding: '10px 20px',
              border: '1px solid #333',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            다이얼로그 열기
          </button>
        </Dialog.Trigger>

        <DefaultContentTemplate>
          <Dialog.Title style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
            계정 설정 변경
          </Dialog.Title>
          <Dialog.Description style={{ color: '#6b7280', marginBottom: '20px' }}>
            이 작업을 계속하려면 비밀번호를 다시 확인해야 합니다.
          </Dialog.Description>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Dialog.Trigger>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                취소 (Trigger로 닫기)
              </button>
            </Dialog.Trigger>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              확인
            </button>
          </div>
        </DefaultContentTemplate>
      </Dialog.Root>
    );
  },
};

/**
 * 초기 열림 상태 (Default Open)
 * - 개발 및 디버깅 시 유용합니다.
 */
export const InitiallyOpen: Story = {
  args: {
    defaultOpen: true,
  },
  render: DefaultDialog.render,
};

/**
 * 커스텀 컨텐츠와 훅 사용 (Controlled Behavior Example)
 * - Dialog Context 훅을 사용하여 Close 버튼을 구현합니다.
 */
const CustomDialogContent = () => {
  const { onClose } = useDialog();

  return (
    <>
      <Dialog.Title style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
        커스텀 훅 사용 예시
      </Dialog.Title>
      <Dialog.Description style={{ color: '#6b7280', marginBottom: '20px' }}>
        `useDialog` 훅을 사용하여 다이얼로그 상태를 제어합니다.
      </Dialog.Description>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          onClick={onClose} // useDialog에서 가져온 onClose 함수 직접 사용
          style={{
            padding: '8px 16px',
            backgroundColor: '#34d399',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          닫기 (useDialog 훅 사용)
        </button>
      </div>
    </>
  );
};

export const CustomControl: Story = {
  args: {
    defaultOpen: false,
  },
  render: (args) => (
    <Dialog.Root {...args}>
      <Dialog.Trigger>
        <button
          style={{
            padding: '10px 20px',
            border: '1px solid #333',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          커스텀 다이얼로그 열기
        </button>
      </Dialog.Trigger>

      <DefaultContentTemplate>
        <CustomDialogContent />
      </DefaultContentTemplate>
    </Dialog.Root>
  ),
};
