import { ProjectDomain } from '@/entities';
import { ProjectCreateForm, createProjectMock } from '@/features';
import type { ActionResult } from '@/features/projects-create/model/server-action';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/projects-create/actions/server-action', () => ({
  createProjectMock: vi.fn(),
}));

const mockedCreateProject = vi.mocked(createProjectMock);

const mockSuccessResponse: ActionResult<ProjectDomain> = {
  success: true,
  data: {
    id: 'test-uuid-123',
    projectName: 'Test Project',
    identifier: 'hashed_identifier',
    description: undefined,
    ownerName: undefined,
    createAt: new Date('2024-01-01'),
    updateAt: new Date('2024-01-01'),
    deleteAt: null,
  },
};

const mockErrorResponse: ActionResult<ProjectDomain> = {
  success: false,
  errors: {
    name: ['이미 존재하는 프로젝트 이름입니다'],
  },
};

describe('ProjectCreateForm 통합 테스트', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step1: 프로젝트 이름 입력', () => {
    it('프로젝트 이름 입력 필드가 렌더링되어야 한다', () => {
      render(<ProjectCreateForm onClick={mockOnClick} />);
      const nameInput = screen.getByPlaceholderText(/프로젝트 이름을 입력하세요/i);
      expect(nameInput).toBeInTheDocument();
    });

    it('1단계에서 이름을 입력하고 버튼을 누르면 2단계로 이동한다', async () => {
      render(<ProjectCreateForm />);
      const input = screen.getByPlaceholderText(/프로젝트 이름을 입력하세요/i);
      const nextBtn = screen.getByText(/프로젝트 생성 시작/i);
      fireEvent.change(input, { target: { value: 'My Awesome Project' } });
      fireEvent.click(nextBtn);
      expect(await screen.findByText(/프라이빗 모드로 생성하기/i)).toBeInTheDocument();
    });

    it('1단계에서 돌아가기 버튼을 누르면 onClick 핸들러가 호출된다', async () => {
      const mockOnClick = vi.fn();
      render(<ProjectCreateForm onClick={mockOnClick} />);
      const returnBtn = screen.getByText(/돌아가기/i);
      fireEvent.click(returnBtn);
      expect(mockOnClick).toHaveBeenCalled();
    });
  });

  describe('Step2: 식별번호 입력', () => {
    it('2단계에서 식별번호를 입력하고 버튼을 누르면 3단계로 이동한다', async () => {
      render(<ProjectCreateForm />);
      // 1단계 -> 2단계
      fireEvent.change(screen.getByPlaceholderText(/프로젝트 이름을 입력하세요/i), {
        target: { value: 'Test Project' },
      });
      fireEvent.click(screen.getByText(/프로젝트 생성 시작/i));

      const input = screen.getByPlaceholderText(/식별번호를 입력하세요/i);
      const confirmInput = screen.getByPlaceholderText(/식별번호를 다시 입력하세요/i);
      const nextBtn = screen.getByText(/프로젝트 생성하기/i);
      fireEvent.change(input, { target: { value: '1234567890' } });
      fireEvent.change(confirmInput, { target: { value: '1234567890' } });
      fireEvent.click(nextBtn);
      expect(await screen.findByText(/프로젝트를 생성하시겠습니까/i)).toBeInTheDocument();
    });

    it('2단계에서 X 버튼을 누르면 onClick 핸들러가 호출된다', async () => {
      const mockOnClick = vi.fn();
      render(<ProjectCreateForm onClick={mockOnClick} />);
      fireEvent.change(screen.getByPlaceholderText(/프로젝트 이름을 입력하세요/i), {
        target: { value: 'Test Project' },
      });
      fireEvent.click(screen.getByText(/프로젝트 생성 시작/i));
      const xBtn = screen.getByRole('button', { name: '' });
      fireEvent.click(xBtn);
      expect(mockOnClick).toHaveBeenCalled();
    });
  });

  describe('Step3: 생성 확인', () => {
    it('3단계에서 취소 버튼을 누르면 onClick 핸들러가 호출된다', async () => {
      const mockOnClick = vi.fn();
      render(<ProjectCreateForm onClick={mockOnClick} />);
      fireEvent.change(screen.getByPlaceholderText(/프로젝트 이름을 입력하세요/i), {
        target: { value: 'Test Project' },
      });
      fireEvent.click(screen.getByText(/프로젝트 생성 시작/i));
      fireEvent.change(screen.getByPlaceholderText(/식별번호를 입력하세요/i), {
        target: { value: '1234567890' },
      });
      fireEvent.change(screen.getByPlaceholderText(/식별번호를 다시 입력하세요/i), {
        target: { value: '1234567890' },
      });
      fireEvent.click(screen.getByText(/프로젝트 생성하기/i));

      const cancelBtn = screen.getByText(/취소/i);
      fireEvent.click(cancelBtn);
      expect(mockOnClick).toHaveBeenCalled();
    });

    it('프로젝트 생성에 성공해야 한다', () => {});
    it('프로젝트 생성에 실패하면 에러를 표시해야 한다', () => {});
  });
});
