import { ENV } from '@/shared/constants';

const LIB_PREFIX = '[TEST]';
const isDev = ENV.CONFIG.IS_DEV;

const info = (message: string, ...args: any[]) => {
  if (isDev) console.log(`%c${LIB_PREFIX}`, 'color: #00bcd4; font-weight: bold;', message, ...args);
}

const warn = (message: string, ...args: any[]) => {
  if (isDev) console.warn(`${LIB_PREFIX}: ${message}`, ...args);
}

const error = (message: string, ...args: any[]) => {
  if (isDev) console.error(`${LIB_PREFIX}: ${message}`, ...args);
}

export const dev = {
  info,
  warn,
  error
}