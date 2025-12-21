import { createProjectMock, ProjectCreateForm } from '@/features';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    createProjectMock: vi.fn(),
  };
});

describe('ProjectCreateForm 통합 테스트', () => {
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
    render(<ProjectCreateForm onClick={mockOnClick}/>);
    const returnBtn = screen.getByText(/돌아가기/i);
    fireEvent.click(returnBtn);
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('2단계에서 식별번호를 입력하고 버튼을 누르면 3단계로 이동한다', async () => {
    render(<ProjectCreateForm />);
    // 1단계 -> 2단계
    fireEvent.change(screen.getByPlaceholderText(/프로젝트 이름을 입력하세요/i), { target: { value: 'Test Project' } });
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
    render(<ProjectCreateForm onClick={mockOnClick}/>);
    fireEvent.change(screen.getByPlaceholderText(/프로젝트 이름을 입력하세요/i), { target: { value: 'Test Project' } });
    fireEvent.click(screen.getByText(/프로젝트 생성 시작/i));
    const xBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(xBtn);
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('3단계에서 취소 버튼을 누르면 onClick 핸들러가 호출된다', async () => {
    const mockOnClick = vi.fn();
    render(<ProjectCreateForm onClick={mockOnClick}/>);
    fireEvent.change(screen.getByPlaceholderText(/프로젝트 이름을 입력하세요/i), { target: { value: 'Test Project' } });
    fireEvent.click(screen.getByText(/프로젝트 생성 시작/i));
    fireEvent.change(screen.getByPlaceholderText(/식별번호를 입력하세요/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText(/식별번호를 다시 입력하세요/i), { target: { value: '1234567890' } });
    fireEvent.click(screen.getByText(/프로젝트 생성하기/i));

    const cancelBtn = screen.getByText(/취소/i);
    fireEvent.click(cancelBtn);
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('마지막 단계에서 시작하기를 누르면 서버 액션이 호출되고 성공 결과가 출력된다', async () => {
    const mockResponse = { success: true, errors: { id: 'test-id', name: 'Test Project' } };
    vi.mocked(createProjectMock).mockResolvedValue(mockResponse);
    window.alert = vi.fn();

    render(<ProjectCreateForm />);
    fireEvent.change(screen.getByPlaceholderText(/프로젝트 이름을 입력하세요/i), { target: { value: 'Test Project' } });
    fireEvent.click(screen.getByText(/프로젝트 생성 시작/i));
    fireEvent.change(screen.getByPlaceholderText(/식별번호를 입력하세요/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText(/식별번호를 다시 입력하세요/i), { target: { value: '1234567890' } });
    fireEvent.click(screen.getByText(/프로젝트 생성하기/i));
    fireEvent.click(screen.getByText(/생성하기/i));
    expect(await screen.findByText(/프로젝트 생성 완료/i)).toBeInTheDocument();

    const startBtn = screen.getByText(/시작하기/i);
    fireEvent.click(startBtn);
    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalled();
    }, { timeout: 2000 });
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('프로젝트 생성 시작'));
  });

  it('서버 액션에서 에러가 발생하면 콘솔에 에러가 출력된다', async () => {
    const mockErrorResponse = {
      success: false,
      errors: {
        formErrors: ['DB 연결 실패'],
        fieldErrors: {}
      }
    };
    vi.mocked(createProjectMock).mockResolvedValue(mockErrorResponse);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ProjectCreateForm />);
    fireEvent.change(screen.getByPlaceholderText(/프로젝트 이름을 입력하세요/i), { target: { value: 'SERVER_ERROR' } });
    fireEvent.click(screen.getByText(/프로젝트 생성 시작/i));
    fireEvent.change(screen.getByPlaceholderText(/식별번호를 입력하세요/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText(/식별번호를 다시 입력하세요/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByText(/프로젝트 생성하기/i));
    fireEvent.click(screen.getByText(/생성하기/i));

    const startBtn = screen.getByText(/시작하기/i);
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('서버 에러 발생'), expect.any(String));
    }, { timeout: 2000 });

    consoleSpy.mockRestore();
  });

  it('서버 액션 호출 시 네트워크 에러가 발생하면 처리된다', async () => {
    vi.mocked(createProjectMock).mockRejectedValue(new Error('Network Error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ProjectCreateForm />);
    fireEvent.change(screen.getByPlaceholderText(/프로젝트 이름을 입력하세요/i), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText(/프로젝트 생성 시작/i));
    fireEvent.change(screen.getByPlaceholderText(/식별번호를 입력하세요/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText(/식별번호를 다시 입력하세요/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByText(/프로젝트 생성하기/i));
    fireEvent.click(screen.getByText(/생성하기/i));

    const startBtn = screen.getByText(/시작하기/i);
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('네트워크 에러 발생'), expect.any(Error));
    }, { timeout: 2000 });

    consoleSpy.mockRestore();
  });
});