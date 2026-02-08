import { Injectable, computed, effect, signal } from '@angular/core';
import { WardrobeItem, WardrobeCategory, Accessory, Outfit, User, DashboardStats } from '../models';
import { MOCK_WARDROBE_ITEMS, MOCK_ACCESSORIES, MOCK_OUTFITS, MOCK_USER, MOCK_WEATHER } from '../mock-data';

interface WardrobeSessionState {
    wardrobeItems: WardrobeItem[];
    accessories: Accessory[];
    outfits: Outfit[];
    currentUser: User;
}

@Injectable({
    providedIn: 'root'
})
export class WardrobeService {
    private static readonly SESSION_KEY = 'dw-session-wardrobe-state';

    private wardrobeItems = signal<WardrobeItem[]>(MOCK_WARDROBE_ITEMS);
    private accessories = signal<Accessory[]>(MOCK_ACCESSORIES);
    private outfits = signal<Outfit[]>(MOCK_OUTFITS);
    private currentUser = signal<User>(MOCK_USER);

    constructor() {
        this.hydrateFromSession();
        effect(() => {
            this.persistToSession({
                wardrobeItems: this.wardrobeItems(),
                accessories: this.accessories(),
                outfits: this.outfits(),
                currentUser: this.currentUser(),
            });
        });
    }

    // Computed signals
    readonly items = this.wardrobeItems.asReadonly();
    readonly accessoryList = this.accessories.asReadonly();
    readonly outfitList = this.outfits.asReadonly();
    readonly user = this.currentUser.asReadonly();

    readonly totalItems = computed(() => this.wardrobeItems().length + this.accessories().length);
    readonly favoriteItems = computed(() => this.wardrobeItems().filter(item => item.favorite));
    readonly recentItems = computed(() =>
        [...this.wardrobeItems()]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 6)
    );

    readonly categoryBreakdown = computed(() => {
        const items = this.wardrobeItems();
        const breakdown: Record<WardrobeCategory, number> = {
            tops: 0,
            bottoms: 0,
            dresses: 0,
            outerwear: 0,
            shoes: 0,
            accessories: 0,
            activewear: 0,
            formal: 0,
            swimwear: 0,
        };

        items.forEach(item => {
            breakdown[item.category]++;
        });

        return Object.entries(breakdown)
            .map(([category, count]) => ({ category: category as WardrobeCategory, count }))
            .filter(item => item.count > 0)
            .sort((a, b) => b.count - a.count);
    });

    readonly dashboardStats = computed<DashboardStats>(() => {
        const items = this.wardrobeItems();
        const sortedByWorn = [...items].sort((a, b) => b.worn - a.worn);
        const leastWorn = [...items].sort((a, b) => a.worn - b.worn).slice(0, 3);

        return {
            totalItems: this.totalItems(),
            totalOutfits: this.outfits().length,
            mostWornItem: sortedByWorn[0],
            leastWornItems: leastWorn,
            recentlyAdded: this.recentItems(),
            categoryBreakdown: this.categoryBreakdown(),
        };
    });

    // CRUD Operations
    getItemById(id: string): WardrobeItem | undefined {
        return this.wardrobeItems().find(item => item.id === id);
    }

    getAccessoryById(id: string): Accessory | undefined {
        return this.accessories().find(item => item.id === id);
    }

    getOutfitById(id: string): Outfit | undefined {
        return this.outfits().find(outfit => outfit.id === id);
    }

    getItemsByCategory(category: WardrobeCategory): WardrobeItem[] {
        return this.wardrobeItems().filter(item => item.category === category);
    }

    addItem(item: Omit<WardrobeItem, 'id' | 'createdAt' | 'worn'>): void {
        const newItem: WardrobeItem = {
            ...item,
            id: `w${Date.now()}`,
            createdAt: new Date(),
            worn: 0,
        };
        this.wardrobeItems.update(items => [...items, newItem]);
    }

    updateItem(id: string, updates: Partial<WardrobeItem>): void {
        this.wardrobeItems.update(items =>
            items.map(item => item.id === id ? { ...item, ...updates } : item)
        );
    }

    deleteItem(id: string): void {
        this.wardrobeItems.update(items => items.filter(item => item.id !== id));
    }

    toggleFavorite(id: string): void {
        this.wardrobeItems.update(items =>
            items.map(item =>
                item.id === id ? { ...item, favorite: !item.favorite } : item
            )
        );
    }

    addOutfit(outfit: Omit<Outfit, 'id' | 'createdAt'>): void {
        const newOutfit: Outfit = {
            ...outfit,
            id: `o${Date.now()}`,
            createdAt: new Date(),
            plannedDates: [...(outfit.plannedDates ?? [])].sort(),
        };
        this.outfits.update(outfits => [...outfits, newOutfit]);
    }

    updateOutfit(id: string, updates: Partial<Outfit>): void {
        this.outfits.update(outfits =>
            outfits.map(outfit => {
                if (outfit.id !== id) {
                    return outfit;
                }
                const next: Outfit = { ...outfit, ...updates };
                if (updates.plannedDates) {
                    next.plannedDates = [...updates.plannedDates].sort();
                }
                return next;
            })
        );
    }

    deleteOutfit(id: string): void {
        this.outfits.update(outfits => outfits.filter(outfit => outfit.id !== id));
    }

    getOutfitsByDate(date: string): Outfit[] {
        return this.outfits().filter(outfit => (outfit.plannedDates ?? []).includes(date));
    }

    // Search & Filter
    searchItems(query: string): WardrobeItem[] {
        const lowerQuery = query.toLowerCase();
        return this.wardrobeItems().filter(item =>
            item.name.toLowerCase().includes(lowerQuery) ||
            item.category.toLowerCase().includes(lowerQuery) ||
            item.color.toLowerCase().includes(lowerQuery) ||
            item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }

    filterByColor(colors: string[]): WardrobeItem[] {
        if (colors.length === 0) return this.wardrobeItems();
        return this.wardrobeItems().filter(item =>
            colors.some(color => item.color.toLowerCase().includes(color.toLowerCase()))
        );
    }

    // Weather suggestion (mock)
    getWeatherSuggestion(): { weather: typeof MOCK_WEATHER; suggestedItems: WardrobeItem[] } {
        const weather = MOCK_WEATHER;
        let suggestedItems: WardrobeItem[] = [];

        if (weather.temp < 10) {
            suggestedItems = this.wardrobeItems().filter(item =>
                item.category === 'outerwear' || item.tags.includes('winter')
            ).slice(0, 3);
        } else if (weather.temp > 25) {
            suggestedItems = this.wardrobeItems().filter(item =>
                item.tags.includes('summer') || item.category === 'dresses'
            ).slice(0, 3);
        } else {
            suggestedItems = this.wardrobeItems().filter(item =>
                item.category === 'tops' || item.category === 'bottoms'
            ).slice(0, 3);
        }

        return { weather, suggestedItems };
    }

    private hydrateFromSession(): void {
        try {
            const raw = window.sessionStorage.getItem(WardrobeService.SESSION_KEY);
            if (!raw) {
                return;
            }
            const parsed = JSON.parse(raw) as Partial<WardrobeSessionState>;
            if (Array.isArray(parsed.wardrobeItems)) {
                this.wardrobeItems.set(parsed.wardrobeItems.map(item => this.hydrateWardrobeItem(item)));
            }
            if (Array.isArray(parsed.accessories)) {
                this.accessories.set(parsed.accessories.map(item => this.hydrateAccessory(item)));
            }
            if (Array.isArray(parsed.outfits)) {
                this.outfits.set(parsed.outfits.map(outfit => this.hydrateOutfit(outfit)));
            }
            if (parsed.currentUser) {
                this.currentUser.set(this.hydrateUser(parsed.currentUser));
            }
        } catch {
            // Ignore invalid session data and continue with defaults.
        }
    }

    private persistToSession(state: WardrobeSessionState): void {
        try {
            window.sessionStorage.setItem(WardrobeService.SESSION_KEY, JSON.stringify(state));
        } catch {
            // Ignore storage failures (private mode/quota).
        }
    }

    private hydrateWardrobeItem(item: WardrobeItem): WardrobeItem {
        return {
            ...item,
            purchaseDate: this.toDate(item.purchaseDate),
            lastWorn: this.toDate(item.lastWorn),
            createdAt: this.toDate(item.createdAt) ?? new Date(),
        };
    }

    private hydrateAccessory(accessory: Accessory): Accessory {
        return {
            ...accessory,
            createdAt: this.toDate(accessory.createdAt) ?? new Date(),
        };
    }

    private hydrateOutfit(outfit: Outfit): Outfit {
        return {
            ...outfit,
            createdAt: this.toDate(outfit.createdAt) ?? new Date(),
            lastWorn: this.toDate(outfit.lastWorn),
            plannedDates: [...(outfit.plannedDates ?? [])].sort(),
        };
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
