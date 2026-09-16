
export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  phone_number: string;
};

export type GoogleLoginRequest = {
  id_token: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type VerifyResetOtpRequest = {
  email: string;
  code: string;
};

export type ResetPasswordRequest = {
  email: string;
  code: string;
  new_password: string;
  new_password_confirm: string;
};

// Khớp apps/authentication/serializers.py -> LoginSerializer
// Chỉ cần username HOẶC phone, không có field email.
export type LoginRequest =
  | { username: string; password: string; phone?: never }
  | { phone: string; password: string; username?: never };