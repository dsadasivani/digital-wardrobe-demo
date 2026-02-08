import { Injectable, effect, signal } from '@angular/core';
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

    private isAuthenticated = signal(true); // Default to true for demo
    private currentUser = signal<User | null>(MOCK_USER);

    constructor() {
        this.hydrateFromSession();
        effect(() => {
            this.persistToSession({
                isAuthenticated: this.isAuthenticated(),
                user: this.currentUser(),
            });
        });
    }

    readonly authenticated = this.isAuthenticated.asReadonly();
    readonly user = this.currentUser.asReadonly();

    login(email: string, password: string): Promise<boolean> {
        // Mock login - always succeeds for demo
        return new Promise((resolve) => {
            setTimeout(() => {
                this.isAuthenticated.set(true);
                this.currentUser.set(MOCK_USER);
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
                resolve(true);
            }, 800);
        });
    }

    logout(): void {
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
    }

    updateProfile(updates: Partial<User>): void {
        this.currentUser.update(user => user ? { ...user, ...updates } : null);
    }

    private hydrateFromSession(): void {
        try {
            const raw = window.sessionStorage.getItem(AuthService.SESSION_KEY);
            if (!raw) {
                return;
            }
            const parsed = JSON.parse(raw) as Partial<AuthSessionState>;
            if (typeof parsed.isAuthenticated === 'boolean') {
                this.isAuthenticated.set(parsed.isAuthenticated);
            }
            if (parsed.user) {
                this.currentUser.set(this.hydrateUser(parsed.user));
            } else if (parsed.isAuthenticated === false) {
                this.currentUser.set(null);
            }
        } catch {
            // Ignore invalid session data and continue with defaults.
        }
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
