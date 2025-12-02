import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  FormField,
  type FormFieldRootProps,
  type FormFieldError,
  useFormField,
} from '@/shared/lib/primitives/form-field/index';

// ------------------------------------------------------------------
// 타입 정의 및 Meta 정의
// ------------------------------------------------------------------

// Storybook Controls에 노출할 FormField.Root의 Props를 정의합니다.
type FormFieldRootOmittedProps = Omit<
  FormFieldRootProps,
  'children' | 'ref' | 'className'
>;

const meta: Meta<typeof FormField.Root> = {
  title: 'Primitive Components/FormField',
  component: FormField.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // ------------------------------------------------------------------
    // 상태 속성 (State Props)
    // ------------------------------------------------------------------
    error: {
      control: 'object',
      description: '필드 에러 상태 객체. `invalid` 상태를 활성화하고 메시지를 표시합니다.',
      table: {
        category: 'State',
        type: { summary: 'FormFieldError' },
      },
    },
    disabled: {
      control: 'boolean',
      description: '폼 필드를 **비활성화** 상태로 만듭니다. Root, Label, Control 요소에 `data-disabled` 속성이 적용됩니다.',
      table: {
        category: 'State',
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    // ------------------------------------------------------------------
    // 데이터 속성 (Data Props)
    // ------------------------------------------------------------------
    name: {
      control: 'text',
      description: '폼 필드의 `name` 속성입니다. (컨트롤 컴포넌트에서 활용됨)',
      table: {
        category: 'Data',
        type: { summary: 'string' },
      },
    },
    // ------------------------------------------------------------------
    // 기타 속성 (ETC Props)
    // className, ref 등 Storybook Controls에서 일반적으로 숨기는 속성은 Omit 했습니다.
    // ------------------------------------------------------------------
  },
};

export default meta;
type Story = StoryObj<FormFieldRootOmittedProps>;

// ------------------------------------------------------------------
// 재사용 가능한 기본 폼 컨트롤 래퍼 컴포넌트 (v. React 19)
// ------------------------------------------------------------------

/**
 * Storybook에서 사용될 실제 Input 컴포넌트입니다.
 * React 19의 동작 방식을 가정하고 forwardRef 없이 ref를 인자로 받습니다.
 */
const StoryInput = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  (props, ref) => {
    // useFormField 훅을 사용하여 FormField Context에서 필요한 ID와 상태를 가져옵니다.
    const { id, labelId, descriptionId, messageId, invalid, disabled, name } = useFormField();

    const ariaDescribedBy = invalid
      ? `${descriptionId} ${messageId}`
      : descriptionId;

    return (
      <input
        ref={ref}
        type="text"
        id={id} // FormFieldControl의 ID와 동일하게 설정 (asChild를 사용하지 않는 경우)
        name={name}
        aria-labelledby={labelId}
        aria-describedby={ariaDescribedBy}
        aria-invalid={invalid}
        disabled={disabled}
        placeholder="값을 입력하세요"
        style={{
          padding: '8px 12px',
          border: `1px solid ${invalid ? 'red' : disabled ? '#ccc' : '#333'}`,
          borderRadius: '4px',
          width: '300px',
          opacity: disabled ? 0.6 : 1,
        }}
        {...props}
      />
    );
  }
);
StoryInput.displayName = 'StoryInput';

/**
 * 기본 렌더링 함수입니다.
 * 모든 스토리는 이 구조를 재사용하여 FormField의 전체 구성을 보여줍니다.
 */
const DefaultRender: Story['render'] = (args) => (
  <FormField.Root {...args} style={{ display: 'grid', gap: '8px' }}>
    <FormField.Label style={{ fontWeight: 'bold' }}>사용자 이름</FormField.Label>

    <FormField.Control>
      {/* 실제 <input> 요소를 FormField.Control 안에 배치합니다.
        여기서는 StoryInput을 사용해 FormField의 Context를 활용합니다.
      */}
      <StoryInput />
    </FormField.Control>

    <FormField.Description style={{ fontSize: '0.875rem', color: '#6b7280' }}>
      이 이름은 공개적으로 표시됩니다.
    </FormField.Description>

    <FormField.Message style={{ fontSize: '0.875rem', color: 'red' }}>
      {/* error prop이 있을 경우 해당 메시지가 표시됩니다. 없으면 children인 "에러 메시지"가 표시됩니다. */}
      필드를 확인해주세요.
    </FormField.Message>
  </FormField.Root>
);

// ------------------------------------------------------------------
// Stories 정의
// ------------------------------------------------------------------

/**
 * 기본 상태 (유효)
 * - error: undefined
 * - disabled: false
 */
export const Default: Story = {
  args: {
    name: 'username',
    error: undefined,
    disabled: false,
  },
  render: DefaultRender,
};

/**
 * 에러 상태 (유효성 검사 실패)
 * - error: { message: '...' }
 * - disabled: false
 * - FormField.Message 컴포넌트가 표시됩니다.
 */
export const Invalid: Story = {
  args: {
    name: 'username',
    error: { message: '사용자 이름은 5자 이상이어야 합니다.' } as FormFieldError,
    disabled: false,
  },
  render: DefaultRender,
};

/**
 * 비활성화 상태
 * - error: undefined
 * - disabled: true
 * - Label과 Root에 data-disabled="true" 속성이 적용됩니다.
 */
export const Disabled: Story = {
  args: {
    name: 'username',
    error: undefined,
    disabled: true,
  },
  render: DefaultRender,
};

/**
 * 에러 + 비활성화 상태 (일반적으로는 동시에 발생시키지 않지만 테스트를 위해)
 * - error: { message: '...' }
 * - disabled: true
 * - 에러 메시지는 표시되지만, Input은 비활성화됩니다.
 */
export const InvalidAndDisabled: Story = {
  args: {
    name: 'username',
    error: { message: '비활성화된 필드에 에러가 있습니다.' } as FormFieldError,
    disabled: true,
  },
  render: DefaultRender,
};

/**
 * FormField.Control에 asChild를 사용한 경우
 * - FormField.Control이 자체 `div` 대신 내부 컴포넌트(여기서는 StoryInput)로 렌더링됩니다.
 * - StoryInput에 `id`, `aria-*` 속성이 직접 전달됩니다.
 */
export const AsChildControl: Story = {
  args: {
    name: 'asChild_input',
    error: undefined,
    disabled: false,
  },
  render: (args) => (
    <FormField.Root {...args} style={{ display: 'grid', gap: '8px' }}>
      <FormField.Label style={{ fontWeight: 'bold' }}>As Child Input</FormField.Label>
      {/* asChild={true} 속성을 추가하여 StoryInput을 Slot으로 렌더링하도록 합니다. */}
      <FormField.Control asChild>
        <StoryInput />
      </FormField.Control>

      <FormField.Description style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        Control이 Input으로 대체되었습니다.
      </FormField.Description>

      <FormField.Message style={{ fontSize: '0.875rem', color: 'red' }}>
        에러 발생 시 표시되는 메시지입니다.
      </FormField.Message>
    </FormField.Root>
  ),
};