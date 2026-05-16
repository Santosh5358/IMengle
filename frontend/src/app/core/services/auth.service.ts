import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
  userId: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  readonly isAuthenticated = signal(this.hasToken());
  readonly currentUser = signal<AuthResponse | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  register(username: string, password: string, country?: string, gender?: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/register`, {
      username, password, country, gender
    }).pipe(tap(res => this.handleAuth(res.data)));
  }

  login(username: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/login`, {
      username, password
    }).pipe(tap(res => this.handleAuth(res.data)));
  }

  createAnonymousSession(): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/anonymous`, {})
      .pipe(tap(res => this.handleAuth(res.data)));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private handleAuth(data: AuthResponse): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    this.isAuthenticated.set(true);
    this.currentUser.set(data);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  private loadUser(): AuthResponse | null {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }
}
