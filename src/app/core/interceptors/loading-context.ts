import { HttpContextToken } from '@angular/common/http';

export const SKIP_GLOBAL_LOADING = new HttpContextToken<boolean>(() => false);
export const SHOW_GLOBAL_COSMOS_LOADING = new HttpContextToken<boolean>(() => false);
