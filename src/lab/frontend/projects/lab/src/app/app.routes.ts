import { Routes } from '@angular/router';
import { Home } from './areas/prefs/home';

export const routes: Routes = [
  { path: '', redirectTo: 'titles', pathMatch: 'full' },
  { path: 'prefs', component: Home },
  {
    path: 'titles',
    loadChildren: () => import('./areas/titles/routes').then((m) => m.titlesRoutes),
  },
  {
    path: 'holds',
    loadChildren: () => import('./areas/holds/routes').then((m) => m.holdsRoutes),
  },
  {
    path: 'outbox',
    loadChildren: () => import('./areas/outbox/routes').then((m) => m.outboxRoutes),
  },
];
