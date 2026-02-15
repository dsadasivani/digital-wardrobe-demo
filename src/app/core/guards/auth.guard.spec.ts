import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { AuthTokenService } from '../services/auth-token.service';

class MockAuthService {
  authenticated = () => true;
}

class MockRouter {
  createUrlTree(commands: string[]): UrlTree {
    return { commands } as unknown as UrlTree;
  }
}

class MockAuthTokenService {
  token = () => null as string | null;
}

describe('authGuard', () => {
  let authService: MockAuthService;
  let authTokenService: MockAuthTokenService;
  let router: MockRouter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: AuthTokenService, useClass: MockAuthTokenService },
        { provide: Router, useClass: MockRouter },
      ],
    });

    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    authTokenService = TestBed.inject(AuthTokenService) as unknown as MockAuthTokenService;
    router = TestBed.inject(Router) as unknown as MockRouter;
  });

  it('returns true when authenticated', () => {
    authService.authenticated = () => true;

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('returns login UrlTree when unauthenticated', () => {
    authService.authenticated = () => false;
    authTokenService.token = () => null;
    const expectedTree = router.createUrlTree(['/login']);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toEqual(expectedTree);
  });

  it('returns true when auth state is stale but token exists', () => {
    authService.authenticated = () => false;
    authTokenService.token = () => 'jwt-token';

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(true);
  });
});
