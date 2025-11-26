import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

function ExampleComponent() {
  return <div>Hello Test</div>;
}

describe('vitest 설정 테스트', () => {
  it('renders text correctly', () => {
    render(<ExampleComponent />);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });
});
