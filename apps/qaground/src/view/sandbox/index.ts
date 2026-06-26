import type { ComponentType } from 'react';

import { AsyncLoadSandbox } from './async-load-sandbox';
import { CartCheckoutSandbox } from './cart-checkout-sandbox';
import { DataTableSandbox } from './data-table-sandbox';
import { DatePickerSandbox } from './date-picker-sandbox';
import { DndSandbox } from './dnd-sandbox';
import { FileUploadSandbox } from './file-upload-sandbox';
import { FormAutosaveSandbox } from './form-autosave-sandbox';
import { InfiniteScrollSandbox } from './infinite-scroll-sandbox';
import { LoginSandbox } from './login-sandbox';
import { ModalSandbox } from './modal-sandbox';
import { MoneyTransferSandbox } from './money-transfer-sandbox';
import { OrderFormSandbox } from './order-form-sandbox';
import { PageNavigationSandbox } from './page-navigation-sandbox';
import { ProfileFormSandbox } from './profile-form-sandbox';
import { RealtimeValidationSandbox } from './realtime-validation-sandbox';
import { RouteGuardSandbox } from './route-guard-sandbox';
import { SessionExpirySandbox } from './session-expiry-sandbox';
import { SignupSandbox } from './signup-sandbox';
import { TabsSandbox } from './tabs-sandbox';
import { ToastSandbox } from './toast-sandbox';
import { TokenStorageSandbox } from './token-storage-sandbox';
import { WizardFormSandbox } from './wizard-form-sandbox';

/** 샌드박스 슬러그 → 테스트 대상 컴포넌트. 챌린지 레지스트리의 sandboxSlug 와 매칭. */
export const SANDBOXES: Record<string, ComponentType> = {
  'login-basic': LoginSandbox,
  'signup-validation': SignupSandbox,
  'data-table': DataTableSandbox,
  'async-load': AsyncLoadSandbox,
  modal: ModalSandbox,
  'drag-and-drop': DndSandbox,
  'file-upload': FileUploadSandbox,
  'order-form': OrderFormSandbox,
  'profile-form': ProfileFormSandbox,
  'session-expiry': SessionExpirySandbox,
  'infinite-scroll': InfiniteScrollSandbox,
  'wizard-form': WizardFormSandbox,
  'toast-notification': ToastSandbox,
  tabs: TabsSandbox,
  'realtime-validation': RealtimeValidationSandbox,
  'date-picker': DatePickerSandbox,
  'cart-checkout': CartCheckoutSandbox,
  'money-transfer': MoneyTransferSandbox,
  'page-navigation': PageNavigationSandbox,
  'token-storage': TokenStorageSandbox,
  'route-guard': RouteGuardSandbox,
  'form-autosave': FormAutosaveSandbox,
};
