export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// 스키마 확정 전까지는 그냥 any로 퉁
export type Database = any;
// export interface Database {}