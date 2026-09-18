import { apiRequest } from "./api";

export type AccountRole = "driver" | "manager";

export type FleetUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
};

type SignInResponse = {
  access: string;
  refresh: string;
  user: FleetUser;
};

type SignUpResponse = {
  message: string;
  user: FleetUser;
};

export const authService = {
  signIn(email: string, password: string) {
    return apiRequest<SignInResponse>("/auth/signin/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((session) => {
      localStorage.setItem("schneider_access_token", session.access);
      localStorage.setItem("schneider_refresh_token", session.refresh);
      return session;
    });
  },

  signUp(payload: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password_confirm: string;
    role: AccountRole;
  }) {
    return apiRequest<SignUpResponse>("/auth/signup/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  signOut() {
    localStorage.removeItem("schneider_access_token");
    localStorage.removeItem("schneider_refresh_token");
  },
};
