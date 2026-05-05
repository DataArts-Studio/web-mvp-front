import { Children, isValidElement } from 'react';

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
