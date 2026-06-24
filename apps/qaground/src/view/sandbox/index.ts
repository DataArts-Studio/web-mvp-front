import type { ComponentType } from 'react';

import { AsyncLoadSandbox } from './async-load-sandbox';
import { DataTableSandbox } from './data-table-sandbox';
import { DndSandbox } from './dnd-sandbox';
import { FileUploadSandbox } from './file-upload-sandbox';
import { LoginSandbox } from './login-sandbox';
import { ModalSandbox } from './modal-sandbox';
import { SignupSandbox } from './signup-sandbox';

/** 샌드박스 슬러그 → 테스트 대상 컴포넌트. 챌린지 레지스트리의 sandboxSlug 와 매칭. */
export const SANDBOXES: Record<string, ComponentType> = {
  'login-basic': LoginSandbox,
  'signup-validation': SignupSandbox,
  'data-table': DataTableSandbox,
  'async-load': AsyncLoadSandbox,
  modal: ModalSandbox,
  'drag-and-drop': DndSandbox,
  'file-upload': FileUploadSandbox,
};
