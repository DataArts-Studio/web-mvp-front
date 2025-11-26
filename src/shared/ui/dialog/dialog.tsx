'use client';
import React from 'react';
import ReactDOM from 'react-dom';
import { useDisclosure } from '@/shared/hooks';
import { composeEventHandlers } from '@/shared/utils';

// ------------------------------------------------------------------
// Types & Context & Context Hook
// ------------------------------------------------------------------
type DialogContextValue = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;

  // a11y
  titleId: string;
  descriptionId: string;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

const useDialogContext = () => {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error('useDialogContext must be used within a DialogProvider');
  return context;
};

// ------------------------------------------------------------------
// Root Component (Provider)
// ------------------------------------------------------------------
interface DialogRootProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const DialogRoot = ({ children, defaultOpen = false }: DialogRootProps) => {
  const disclosure = useDisclosure(defaultOpen);

  // a11y
  const id = React.useId();
  const titleId = `title-${id}`;
  const descriptionId = `description-${id}`;

  return (
    <DialogContext.Provider value={{ ...disclosure, titleId, descriptionId }}>
      {children}
    </DialogContext.Provider>
  );
};

// ------------------------------------------------------------------
// Trigger Component (Open Button)
// ------------------------------------------------------------------
interface DialogTriggerProps {
  children: React.ReactElement;
}

const DialogTrigger = ({ children }: DialogTriggerProps) => {
  const { onOpen, isOpen } = useDialogContext();
  const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  return React.cloneElement(child, {
    // a11y
    'aria-haspopup': 'dialog',
    'aria-expanded': isOpen,

    // 자식의 원래 onClick과 정의한 onOpen을 안전하게 합쳐줌
    onClick: composeEventHandlers(child.props.onClick, onOpen),
  });
};

// ------------------------------------------------------------------
// Portal Component (렌더링 위치)
// ------------------------------------------------------------------
interface DialogPortalProps {
  children: React.ReactNode;
}

const DialogPortal = ({ children }: DialogPortalProps) => {
  const { isOpen } = useDialogContext();
  const [mounted, setMounted] = React.useState(false);

  // SSR 이슈 방지(클라만 렌더링)
  React.useEffect(() => setMounted(true), []);
  if (!isOpen || !mounted) return null;

  // body 태그 밑에 붙이기
  return ReactDOM.createPortal(children, document.body);
};

// ------------------------------------------------------------------
// Overlay Component (Background clock)
// TODO: 스타일 속성 분리(globalcss)
// ------------------------------------------------------------------
interface DialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const DialogOverlay = ({ className, ...props }: DialogOverlayProps) => {
  const { onClose } = useDialogContext();
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        ...props.style,
      }}
      onClick={onClose}
      {...props}
    />
  );
};

// ------------------------------------------------------------------
// Content Component
// TODO: 스타일 속성 분리(globalcss)
// ------------------------------------------------------------------
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
const DialogContent = ({ className, ...props }: DialogContentProps) => {
  const { titleId, descriptionId } = useDialogContext();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={className}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001,
        ...props.style,
      }}
      {...props}
    />
  );
};

// ------------------------------------------------------------------
// Title, Description Component
// ------------------------------------------------------------------
const DialogTitle = (props: React.HTMLAttributes<HTMLHeadingElement>) => {
  const { titleId } = useDialogContext();
  return <h2 id={titleId} {...props} />;
};

const DialogDescription = (props: React.HTMLAttributes<HTMLParagraphElement>) => {
  const { descriptionId } = useDialogContext();
  return <p id={descriptionId} {...props} />;
};

// ------------------------------------------------------------------
// Export
// ------------------------------------------------------------------
export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
};

// ------------------------------------------------------------------
// Export Types
// ------------------------------------------------------------------
export type {
  DialogRootProps,
  DialogTriggerProps,
  DialogPortalProps,
  DialogOverlayProps,
  DialogContentProps,
};

// ------------------------------------------------------------------
// Export Hook
// ------------------------------------------------------------------
export { useDialogContext as useDialog };
