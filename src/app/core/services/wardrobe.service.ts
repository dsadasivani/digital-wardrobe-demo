import { inject, Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { WardrobeItem, WardrobeCategory, Accessory, Outfit, DashboardStats } from '../models';
import { WardrobeApi } from '../api/wardrobe.api';
import { AccessoriesApi } from '../api/accessories.api';
import { OutfitsApi } from '../api/outfits.api';
import { mapWardrobeItemDtoToModel, mapWardrobeItemToCreateDto, mapWardrobeItemToUpdateDto } from '../mappers/wardrobe.mapper';
import { mapAccessoryDtoToModel, mapAccessoryToCreateDto, mapAccessoryToUpdateDto } from '../mappers/accessories.mapper';
import { mapOutfitDtoToModel, mapOutfitToCreateDto, mapOutfitToUpdateDto } from '../mappers/outfits.mapper';

const MOCK_WEATHER = {
    temp: 29,
    condition: 'Sunny' as const,
    humidity: 25,
    location: 'Hyderabad, India',
};

@Injectable({
    providedIn: 'root'
})
export class WardrobeService {
    private readonly wardrobeApi = inject(WardrobeApi);
    private readonly accessoriesApi = inject(AccessoriesApi);
    private readonly outfitsApi = inject(OutfitsApi);

    private wardrobeItems = signal<WardrobeItem[]>([]);
    private accessories = signal<Accessory[]>([]);
    private outfits = signal<Outfit[]>([]);

    // ── Public readonly signals (consumed by components) ─────────
    readonly items = this.wardrobeItems.asReadonly();
    readonly accessoryList = this.accessories.asReadonly();
    readonly outfitList = this.outfits.asReadonly();

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
            tops: 0, bottoms: 0, dresses: 0, outerwear: 0, shoes: 0,
            accessories: 0, activewear: 0, formal: 0, swimwear: 0,
        };
        items.forEach(item => { breakdown[item.category]++; });
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
            totalAccessories: this.accessories().length,
            totalOutfits: this.outfits().length,
            mostWornItem: sortedByWorn[0],
            leastWornItems: leastWorn,
            recentlyAdded: this.recentItems(),
            categoryBreakdown: this.categoryBreakdown(),
        };
    });

    // ── Data loading from backend ────────────────────────────────

    async loadAll(): Promise<void> {
        const [wardrobeItems, accessoryItems, outfitItems] = await Promise.all([
            firstValueFrom(this.wardrobeApi.list()),
            firstValueFrom(this.accessoriesApi.list()),
            firstValueFrom(this.outfitsApi.list()),
        ]);
        this.wardrobeItems.set(wardrobeItems.map(mapWardrobeItemDtoToModel));
        this.accessories.set(accessoryItems.map(mapAccessoryDtoToModel));
        this.outfits.set(outfitItems.map(mapOutfitDtoToModel));
    }

    clearAll(): void {
        this.wardrobeItems.set([]);
        this.accessories.set([]);
        this.outfits.set([]);
    }

    // ── Wardrobe Item CRUD ───────────────────────────────────────

    getItemById(id: string): WardrobeItem | undefined {
        return this.wardrobeItems().find(item => item.id === id);
    }

    getItemsByCategory(category: WardrobeCategory): WardrobeItem[] {
        return this.wardrobeItems().filter(item => item.category === category);
    }

    async addItem(item: Omit<WardrobeItem, 'id' | 'createdAt' | 'worn'>): Promise<void> {
        const dto = mapWardrobeItemToCreateDto(item as WardrobeItem);
        const response = await firstValueFrom(this.wardrobeApi.create(dto));
        const newItem = mapWardrobeItemDtoToModel(response);
        this.wardrobeItems.update(items => [...items, newItem]);
    }

    async updateItem(id: string, updates: Partial<WardrobeItem>): Promise<void> {
        const dto = mapWardrobeItemToUpdateDto(updates);
        const response = await firstValueFrom(this.wardrobeApi.update(id, dto));
        const updated = mapWardrobeItemDtoToModel(response);
        this.wardrobeItems.update(items =>
            items.map(item => item.id === id ? updated : item)
        );
    }

    async deleteItem(id: string): Promise<void> {
        await firstValueFrom(this.wardrobeApi.delete(id));
        this.wardrobeItems.update(items => items.filter(item => item.id !== id));
    }

    async toggleFavorite(id: string): Promise<void> {
        const item = this.wardrobeItems().find(i => i.id === id);
        if (item) {
            await this.updateItem(id, { favorite: !item.favorite });
            return;
        }
        const accessory = this.accessories().find(a => a.id === id);
        if (accessory) {
            await this.toggleAccessoryFavorite(id);
        }
    }

    // ── Accessory CRUD ───────────────────────────────────────────

    getAccessoryById(id: string): Accessory | undefined {
        return this.accessories().find(item => item.id === id);
    }

    async addAccessory(accessory: Omit<Accessory, 'id' | 'createdAt' | 'worn' | 'lastWorn'>): Promise<void> {
        const dto = mapAccessoryToCreateDto(accessory as Accessory);
        const response = await firstValueFrom(this.accessoriesApi.create(dto));
        const newAccessory = mapAccessoryDtoToModel(response);
        this.accessories.update(items => [...items, newAccessory]);
    }

    async updateAccessory(id: string, updates: Partial<Accessory>): Promise<void> {
        const dto = mapAccessoryToUpdateDto(updates);
        const response = await firstValueFrom(this.accessoriesApi.update(id, dto));
        const updated = mapAccessoryDtoToModel(response);
        this.accessories.update(items =>
            items.map(item => item.id === id ? updated : item)
        );
    }

    async deleteAccessory(id: string): Promise<void> {
        await firstValueFrom(this.accessoriesApi.delete(id));
        this.accessories.update(items => items.filter(item => item.id !== id));
    }

    async toggleAccessoryFavorite(id: string): Promise<void> {
        const accessory = this.accessories().find(a => a.id === id);
        if (accessory) {
            await this.updateAccessory(id, { favorite: !accessory.favorite });
        }
    }

    async markAccessoryAsWorn(id: string): Promise<void> {
        const response = await firstValueFrom(this.accessoriesApi.markAsWorn(id));
        const updated = mapAccessoryDtoToModel(response);
        this.accessories.update(items => items.map(item => item.id === id ? updated : item));
    }

    // ── Outfit CRUD ──────────────────────────────────────────────

    getOutfitById(id: string): Outfit | undefined {
        return this.outfits().find(outfit => outfit.id === id);
    }

    async addOutfit(outfit: Omit<Outfit, 'id' | 'createdAt' | 'worn'>): Promise<void> {
        const dto = mapOutfitToCreateDto(outfit as Outfit);
        const response = await firstValueFrom(this.outfitsApi.create(dto));
        const newOutfit = mapOutfitDtoToModel(response);
        this.outfits.update(outfits => [...outfits, newOutfit]);
    }

    async updateOutfit(id: string, updates: Partial<Outfit>): Promise<void> {
        const dto = mapOutfitToUpdateDto(updates);
        const response = await firstValueFrom(this.outfitsApi.update(id, dto));
        const updated = mapOutfitDtoToModel(response);
        this.outfits.update(outfits =>
            outfits.map(outfit => outfit.id === id ? updated : outfit)
        );
    }

    async deleteOutfit(id: string): Promise<void> {
        await firstValueFrom(this.outfitsApi.delete(id));
        this.outfits.update(outfits => outfits.filter(outfit => outfit.id !== id));
    }

    async markItemAsWorn(id: string): Promise<void> {
        const response = await firstValueFrom(this.wardrobeApi.markAsWorn(id));
        const updated = mapWardrobeItemDtoToModel(response);
        this.wardrobeItems.update(items => items.map(item => item.id === id ? updated : item));
    }

    async markOutfitAsWorn(id: string): Promise<void> {
        const response = await firstValueFrom(this.outfitsApi.markAsWorn(id));
        const updated = mapOutfitDtoToModel(response);
        this.outfits.update(outfits => outfits.map(outfit => outfit.id === id ? updated : outfit));
        await this.loadAll();
    }

    getOutfitsByDate(date: string): Outfit[] {
        return this.outfits().filter(outfit => (outfit.plannedDates ?? []).includes(date));
    }

    // ── Search & Filter ──────────────────────────────────────────

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

    // ── Weather suggestion (mock — will be replaced by backend) ──

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
