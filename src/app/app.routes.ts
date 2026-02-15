import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
        title: 'Login - Digital Wardrobe'
    },
    {
        path: 'signup',
        loadComponent: () => import('./features/auth/signup.component').then(m => m.SignupComponent),
        title: 'Sign Up - Digital Wardrobe'
    },
    {
        path: 'wardrobe',
        loadComponent: () => import('./features/wardrobe/wardrobe/wardrobe.component').then(m => m.WardrobeComponent),
        title: 'My Wardrobe - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'wardrobe/add',
        loadComponent: () => import('./features/wardrobe/add-item/add-item.component').then(m => m.AddItemComponent),
        title: 'Add Item - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'wardrobe/category/:category',
        loadComponent: () => import('./features/wardrobe/wardrobe/wardrobe.component').then(m => m.WardrobeComponent),
        title: 'Wardrobe - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'wardrobe/:id/edit',
        loadComponent: () => import('./features/wardrobe/edit-item/edit-item.component').then(m => m.EditItemComponent),
        title: 'Edit Item - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'wardrobe/:id',
        loadComponent: () => import('./features/wardrobe/item-detail/item-detail.component').then(m => m.ItemDetailComponent),
        title: 'Item Details - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'accessories',
        loadComponent: () => import('./features/accessories/accessories.component').then(m => m.AccessoriesComponent),
        title: 'Accessories - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'accessories/add',
        loadComponent: () => import('./features/accessories/add-accessory/add-accessory.component').then(m => m.AddAccessoryComponent),
        title: 'Add Accessory - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'accessories/:id/edit',
        loadComponent: () => import('./features/accessories/edit-accessory/edit-accessory.component').then(m => m.EditAccessoryComponent),
        title: 'Edit Accessory - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'accessories/:id',
        loadComponent: () => import('./features/accessories/accessory-detail/accessory-detail.component').then(m => m.AccessoryDetailComponent),
        title: 'Accessory Details - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'outfits',
        loadComponent: () => import('./features/outfits/outfits.component').then(m => m.OutfitsComponent),
        title: 'My Outfits - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'calendar',
        loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent),
        title: 'Outfit Calendar - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'outfits/:id',
        loadComponent: () => import('./features/outfits/outfit-detail/outfit-detail.component').then(m => m.OutfitDetailComponent),
        title: 'Outfit Details - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'outfit-canvas',
        loadComponent: () => import('./features/outfit-canvas/outfit-canvas.component').then(m => m.OutfitCanvasComponent),
        title: 'Outfit Canvas - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'outfit-canvas/:id',
        loadComponent: () => import('./features/outfit-canvas/outfit-canvas.component').then(m => m.OutfitCanvasComponent),
        title: 'Edit Outfit - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Profile - Digital Wardrobe',
        canActivate: [authGuard],
    },
    {
        path: '**',
        redirectTo: ''
    }
];
