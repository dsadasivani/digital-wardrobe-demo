import { Injectable, signal } from '@angular/core';
import { MOCK_USER } from '../mock-data';
import { User } from '../models';

interface AuthSessionState {
    isAuthenticated: boolean;
    user: User | null;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private static readonly SESSION_KEY = 'dw-session-auth-state';

    private readonly initialState = this.hydrateFromSession();
    private isAuthenticated = signal(this.initialState.isAuthenticated);
    private currentUser = signal<User | null>(this.initialState.user);

    readonly authenticated = this.isAuthenticated.asReadonly();
    readonly user = this.currentUser.asReadonly();

    login(email: string, password: string): Promise<boolean> {
        // Mock login - always succeeds for demo
        return new Promise((resolve) => {
            setTimeout(() => {
                this.isAuthenticated.set(true);
                this.currentUser.set(MOCK_USER);
                this.persistSnapshot();
                resolve(true);
            }, 800);
        });
    }

    loginWithGoogle(): Promise<boolean> {
        // Mock social login
        return this.login('google@demo.com', '');
    }

    loginWithApple(): Promise<boolean> {
        // Mock social login
        return this.login('apple@demo.com', '');
    }

    signup(name: string, email: string, password: string): Promise<boolean> {
        // Mock signup
        return new Promise((resolve) => {
            setTimeout(() => {
                const newUser: User = {
                    ...MOCK_USER,
                    id: `u${Date.now()}`,
                    name,
                    email,
                    createdAt: new Date(),
                };
                this.currentUser.set(newUser);
                this.isAuthenticated.set(true);
                this.persistSnapshot();
                resolve(true);
            }, 800);
        });
    }

    logout(): void {
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.persistSnapshot();
    }

    updateProfile(updates: Partial<User>): void {
        this.currentUser.update(user => user ? { ...user, ...updates } : null);
        this.persistSnapshot();
    }

    private hydrateFromSession(): AuthSessionState {
        const fallback: AuthSessionState = {
            isAuthenticated: true,
            user: MOCK_USER,
        };

        try {
            const raw = window.sessionStorage.getItem(AuthService.SESSION_KEY);
            if (!raw) {
                return fallback;
            }
            const parsed = JSON.parse(raw) as Partial<AuthSessionState>;
            const isAuthenticated = typeof parsed.isAuthenticated === 'boolean'
                ? parsed.isAuthenticated
                : fallback.isAuthenticated;
            if (parsed.user) {
                return {
                    isAuthenticated,
                    user: this.hydrateUser(parsed.user),
                };
            }
            if (isAuthenticated === false) {
                return {
                    isAuthenticated: false,
                    user: null,
                };
            }
            return {
                isAuthenticated,
                user: fallback.user,
            };
        } catch {
            // Ignore invalid session data and continue with defaults.
            return fallback;
        }
    }

    private persistSnapshot(): void {
        this.persistToSession({
            isAuthenticated: this.isAuthenticated(),
            user: this.currentUser(),
        });
    }

    private persistToSession(state: AuthSessionState): void {
        try {
            window.sessionStorage.setItem(AuthService.SESSION_KEY, JSON.stringify(state));
        } catch {
            // Ignore storage failures (private mode/quota).
        }
    }

    private hydrateUser(user: User): User {
        return {
            ...user,
            createdAt: this.toDate(user.createdAt) ?? new Date(),
        };
    }

    private toDate(value: Date | string | undefined): Date | undefined {
        if (!value) {
            return undefined;
        }
        if (value instanceof Date) {
            return value;
        }
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? undefined : date;
    }
}
