import { User } from 'firebase/auth';

export interface AuthResponse {
  user: User | null;
  error: Error | null;
}

export interface ResetPasswordResponse {
  error: Error | null;
}

export interface LogoutResponse {
  error: Error | null;
} 