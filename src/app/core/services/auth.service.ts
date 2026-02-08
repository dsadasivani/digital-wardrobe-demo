import { Injectable, signal } from '@angular/core';
import { MOCK_USER } from '../mock-data';
import { User } from '../models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private isAuthenticated = signal(true); // Default to true for demo
    private currentUser = signal<User | null>(MOCK_USER);

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
}
