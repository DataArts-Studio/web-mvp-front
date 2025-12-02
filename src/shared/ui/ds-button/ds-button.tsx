'use client';
import React from 'react';

import { Button } from '@/shared';

export interface ButtonDesignSystemProps {
  title: string;
  className?: string;
}

export const DSButton = ({ title }: ButtonDesignSystemProps) => {
  return <Button>{title}</Button>;
};
