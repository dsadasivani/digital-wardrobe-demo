import { Injectable, signal, computed } from '@angular/core';
import { WardrobeItem, WardrobeCategory, Accessory, Outfit, User, DashboardStats } from '../models';
import { MOCK_WARDROBE_ITEMS, MOCK_ACCESSORIES, MOCK_OUTFITS, MOCK_USER, MOCK_WEATHER } from '../mock-data';

@Injectable({
    providedIn: 'root'
})
export class WardrobeService {
    private wardrobeItems = signal<WardrobeItem[]>(MOCK_WARDROBE_ITEMS);
    private accessories = signal<Accessory[]>(MOCK_ACCESSORIES);
    private outfits = signal<Outfit[]>(MOCK_OUTFITS);
    private currentUser = signal<User>(MOCK_USER);

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
        };
        this.outfits.update(outfits => [...outfits, newOutfit]);
    }

    deleteOutfit(id: string): void {
        this.outfits.update(outfits => outfits.filter(outfit => outfit.id !== id));
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
}
