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

export type ServiceListParams = {
  section_code?: string;
  is_active?: boolean;
  search?: string;
};

// Dùng cho POST/PATCH /api/admin/services/ — gửi dạng multipart/form-data
// vì backend nhận file ảnh (ServiceAdminWriteSerializer)
export type ServiceMutationPayload = {
  primary_image_id?: number | null;
  code?: string;
  section_code?: string;
  name?: string;
  description?: string;
  form_schema?: Record<string, unknown>;
  pricing_config?: Record<string, unknown>;
  is_active?: boolean;
  images?: File[];
  delete_image_ids?: number[];
};

export type ServiceQuickToggleRequest = {
  id: number;
  is_active: boolean;
};