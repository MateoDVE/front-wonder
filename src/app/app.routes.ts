import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./Pages/catalog/catalog').then(m => m.CatalogPage),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./Pages/admin/admin').then(m => m.AdminPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
