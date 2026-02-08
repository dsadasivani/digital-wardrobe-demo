import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard - Digital Wardrobe'
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
        title: 'Login - Digital Wardrobe'
    },
    {
        path: 'wardrobe',
        loadComponent: () => import('./features/wardrobe/wardrobe/wardrobe.component').then(m => m.WardrobeComponent),
        title: 'My Wardrobe - Digital Wardrobe'
    },
    {
        path: 'wardrobe/add',
        loadComponent: () => import('./features/wardrobe/add-item/add-item.component').then(m => m.AddItemComponent),
        title: 'Add Item - Digital Wardrobe'
    },
    {
        path: 'wardrobe/category/:category',
        loadComponent: () => import('./features/wardrobe/wardrobe/wardrobe.component').then(m => m.WardrobeComponent),
        title: 'Wardrobe - Digital Wardrobe'
    },
    {
        path: 'wardrobe/:id/edit',
        loadComponent: () => import('./features/wardrobe/edit-item/edit-item.component').then(m => m.EditItemComponent),
        title: 'Edit Item - Digital Wardrobe'
    },
    {
        path: 'wardrobe/:id',
        loadComponent: () => import('./features/wardrobe/item-detail/item-detail.component').then(m => m.ItemDetailComponent),
        title: 'Item Details - Digital Wardrobe'
    },
    {
        path: 'accessories',
        loadComponent: () => import('./features/accessories/accessories.component').then(m => m.AccessoriesComponent),
        title: 'Accessories - Digital Wardrobe'
    },
    {
        path: 'outfits',
        loadComponent: () => import('./features/outfits/outfits.component').then(m => m.OutfitsComponent),
        title: 'My Outfits - Digital Wardrobe'
    },
    {
        path: 'outfits/:id',
        loadComponent: () => import('./features/outfits/outfit-detail/outfit-detail.component').then(m => m.OutfitDetailComponent),
        title: 'Outfit Details - Digital Wardrobe'
    },
    {
        path: 'outfit-canvas',
        loadComponent: () => import('./features/outfit-canvas/outfit-canvas.component').then(m => m.OutfitCanvasComponent),
        title: 'Outfit Canvas - Digital Wardrobe'
    },
    {
        path: 'outfit-canvas/:id',
        loadComponent: () => import('./features/outfit-canvas/outfit-canvas.component').then(m => m.OutfitCanvasComponent),
        title: 'Edit Outfit - Digital Wardrobe'
    },
    {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Profile - Digital Wardrobe'
    },
    {
        path: '**',
        redirectTo: ''
    }
];
