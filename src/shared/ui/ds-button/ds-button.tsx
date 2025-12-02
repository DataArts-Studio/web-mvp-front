'use client';
import React from 'react';

import { Button } from '@/shared';

export interface DSButtonProps {
  title: string;
  className?: string;
}

export const DSButton = ({ title }: DSButtonProps) => {
  return <Button>{title}</Button>;
};
