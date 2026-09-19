import type { User } from "./User";

export type UserResponse = Partial<User>;

export type AuthResponse = {
  access: string;
  refresh: string;
  user: UserResponse;
};

export type CustomerProfileResponse = User;


// Wrapper chung khớp format { message, data } mà các API ngoài auth trả về
export type ApiMessageResponse<T> = {
  message: string;
  data: T;
};

export type ServiceListResponse = ApiMessageResponse<import("./Service").ServiceListItem[]>;
export type ServiceDetailResponse = ApiMessageResponse<import("./Service").ServiceDetail>;