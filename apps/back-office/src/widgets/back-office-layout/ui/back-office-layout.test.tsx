import type { NavItem } from '@/entities/admin-dashboard';
import { render, screen, within } from '@testing-library/react';
import { LayoutDashboard, Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { BackOfficeLayout } from './back-office-layout';

const navItems: NavItem[] = [
  { label: '대시보드', icon: LayoutDashboard, href: '/', current: true },
  // 미구현 메뉴(href 없음)
  { label: '사용자 관리', icon: Users },
];

describe('BackOfficeLayout', () => {
  it('현재 메뉴는 실제 href를 가진 aria-current="page" 링크로 렌더된다', () => {
    render(<BackOfficeLayout navItems={navItems}>본문</BackOfficeLayout>);

    const current = screen.getByRole('link', { name: /대시보드/ });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveAttribute('href', '/');
  });

  it('미구현 메뉴는 href="#" 링크가 아니라 비활성 버튼으로 렌더된다', () => {
    render(<BackOfficeLayout navItems={navItems}>본문</BackOfficeLayout>);

    expect(screen.queryByRole('link', { name: /사용자 관리/ })).toBeNull();
    const button = screen.getByRole('button', { name: /사용자 관리/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('admin prop이 없으면 관리자 이메일을 하드코딩하지 않는다 (스켈레톤)', () => {
    render(<BackOfficeLayout navItems={navItems}>본문</BackOfficeLayout>);

    expect(screen.queryByText(/@/)).toBeNull();
  });

  it('admin prop을 주면 이름과 이메일을 렌더한다', () => {
    render(
      <BackOfficeLayout navItems={navItems} admin={{ name: '홍길동', email: 'hong@testea.com' }}>
        본문
      </BackOfficeLayout>
    );

    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('hong@testea.com')).toBeInTheDocument();
  });

  it('navigation 랜드마크가 main 안에 중첩되지 않는다', () => {
    render(<BackOfficeLayout navItems={navItems}>본문</BackOfficeLayout>);

    const main = screen.getByRole('main');
    expect(within(main).queryByRole('navigation')).toBeNull();
  });
});
