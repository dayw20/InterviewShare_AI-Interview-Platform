// src/types/auth.ts

export interface User {
    username: string;
    id?: number;
    email?: string;
    [key: string]: any; // For any additional properties
  }
  
  export interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
  }
  
  export interface LoginForm {
    username: string;
    password: string;
  }
  
  export interface RegisterForm {
    username: string;
    email: string;
    password1: string;
    password2: string;
  }
  
  export interface LoginResponse {
    key: string;
    user?: User;
  }
  
  export interface GoogleLoginResponse {
    token: string;
    user: User;
  }

  export interface GoogleJwtPayload {
    email: string;
    name: string;
    sub: string;
    [key: string]: any;
  }