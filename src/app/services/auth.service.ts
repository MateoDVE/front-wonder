import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface AuthUser {
  id: number;
  email: string;
  nombre: string;
  apellido?: string;
  rol: string;
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private readonly USER_KEY = 'wonder_auth_user';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password });
  }

  setToken(token: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('access_token', token);
  }

  setUser(user: AuthUser) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  logout() {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem(this.USER_KEY);
  }
}
