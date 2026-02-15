import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthApi } from '../api/auth.api';
import { AuthResponseDto, UserDto } from '../dto/auth.dto';
import { AuthTokenService } from './auth-token.service';
import { AuthService } from './auth.service';
import { WardrobeService } from './wardrobe.service';

class MockAuthApi {
  login = vi.fn();
  signup = vi.fn();
  logout = vi.fn(() => of({ message: 'ok' }));
  me = vi.fn();
  updateMe = vi.fn();
}

class MockAuthTokenService {
  private readonly _token = signal<string | null>(null);
  readonly token = this._token.asReadonly();

  setToken(token: string): void {
    this._token.set(token);
  }

  clearToken(): void {
    this._token.set(null);
  }
}

class MockWardrobeService {
  loadAll = vi.fn(() => Promise.resolve());
  clearAll = vi.fn();
}

function buildUserDto(): UserDto {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'user@example.com',
    avatar: null,
    preferences: {
      favoriteColors: [],
      stylePreferences: [],
      location: null,
      notificationsEnabled: true,
      darkMode: false,
    },
    createdAt: new Date().toISOString(),
  };
}

function buildAuthResponseDto(): AuthResponseDto {
  return {
    token: 'jwt-token',
    user: buildUserDto(),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let authApi: MockAuthApi;
  let wardrobeService: MockWardrobeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthApi, useClass: MockAuthApi },
        { provide: AuthTokenService, useClass: MockAuthTokenService },
        { provide: WardrobeService, useClass: MockWardrobeService },
      ],
    });

    service = TestBed.inject(AuthService);
    authApi = TestBed.inject(AuthApi) as unknown as MockAuthApi;
    wardrobeService = TestBed.inject(WardrobeService) as unknown as MockWardrobeService;
  });

  it('keeps authenticated session when profile data load fails after login', async () => {
    authApi.login.mockReturnValue(of(buildAuthResponseDto()));
    wardrobeService.loadAll.mockReturnValue(Promise.reject(new Error('load failed')));

    const result = await service.login('user@example.com', 'password123');

    expect(result).toBe(true);
    expect(service.authenticated()).toBe(true);
    expect(service.user()?.email).toBe('user@example.com');
  });

  it('clears session when login API fails', async () => {
    authApi.login.mockReturnValue(throwError(() => new Error('invalid credentials')));

    const result = await service.login('user@example.com', 'bad-password');

    expect(result).toBe(false);
    expect(service.authenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });
});
