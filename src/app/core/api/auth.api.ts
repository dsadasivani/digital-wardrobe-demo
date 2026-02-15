import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AuthResponseDto,
  LoginRequestDto,
  SignupRequestDto,
  UpdateUserRequestDto,
  UserDto,
} from '../dto/auth.dto';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  login(request: LoginRequestDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiBaseUrl}/auth/login`, request);
  }

  signup(request: SignupRequestDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiBaseUrl}/auth/signup`, request);
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiBaseUrl}/auth/logout`, {});
  }

  me(): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiBaseUrl}/users/me`);
  }

  updateMe(request: UpdateUserRequestDto): Observable<UserDto> {
    return this.http.patch<UserDto>(`${this.apiBaseUrl}/users/me`, request);
  }
}
