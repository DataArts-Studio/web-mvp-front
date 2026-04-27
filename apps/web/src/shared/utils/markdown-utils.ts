import { Children, isValidElement } from 'react';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getTextContent(children: React.ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string') return child;
      if (isValidElement<{ children?: React.ReactNode }>(child) && child.props.children) {
        return getTextContent(child.props.children);
      }
      return '';
    })
    .join('');
}
