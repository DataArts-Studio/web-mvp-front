export const REGEX = {
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
  NUMBER_ONLY: /^[0-9]+$/,
  PHONE: /^01[016789]-?[0-9]{3,4}-?[0-9]{4}$/,
  KOREAN: /^[가-힣]+$/,
} as const;
