import React from 'react';

import { Button, buttonVariants, cn } from '@/shared';
import { DSButtonProps } from '@/shared/ui/ds-button';

export const DSButton = ({ children, variant, size, className, ref, ...props }: DSButtonProps) => {
  return (
    <Button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Button>
  );
};
