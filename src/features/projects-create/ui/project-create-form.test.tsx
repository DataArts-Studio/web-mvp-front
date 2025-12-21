import { ProjectCreateForm } from '@/features';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('ProjectCreateForm 통합 테스트', () => {
  it('1단계에서 이름을 입력하고 버튼을 누르면 2단계로 이동한다', async () => {
    render(<ProjectCreateForm />);
    const input = screen.getByPlaceholderText(/프로젝트 이름을 입력하세요/i);
    const nextBtn = screen.getByText(/프로젝트 생성 시작/i);
    fireEvent.change(input, { target: { value: 'My Awesome Project' } });
    fireEvent.click(nextBtn);
    expect(await screen.findByText(/프라이빗 모드로 생성하기/i)).toBeInTheDocument();
  });

  it('1단계에서 돌아가기 버튼을 누르면 onClick 핸들러가 호출된다', async () => {});

  it('2단계에서 식별번호를 입력하고 버튼을 누르면 3단계로 이동한다', async () => {});

  it('2단계에서 X 버튼을 누르면 onClick 핸들러가 호출된다', async () => {});

  it('3단계에서 취소 버튼을 누르면 onClick 핸들러가 호출된다', async () => {});

  it('마지막 단계에서 생성하기를 누르면 서버 액션이 호출되고 성공 결과가 출력된다', async () => {});

  it('서버 액션에서 에러가 발생하면 콘솔에 에러가 출력된다', async () => {});

  it('서버 액션 호출 시 네트워크 에러가 발생하면 처리된다', async () => {});
});