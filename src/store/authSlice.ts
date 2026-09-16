import type { UserResponse } from "@/types/Response";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AuthState = { user: UserResponse | null };
const initialState: AuthState = { user: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserResponse | null>) => {
      state.user = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
