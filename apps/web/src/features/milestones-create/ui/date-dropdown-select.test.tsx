import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DateDropdownSelect } from './date-dropdown-select';

describe('DateDropdownSelect 접근성', () => {
  it('연·월·일 콤보박스에 필드 이름이 붙는다', () => {
    render(<DateDropdownSelect label="시작일" value="2026-10-13" onChange={vi.fn()} />);

    expect(screen.getByRole('combobox', { name: '시작일 연도' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '시작일 월' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '시작일 일' })).toBeInTheDocument();
  });
});
