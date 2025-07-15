import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { LoginUserComponent } from './auth/loginuser/loginuser.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginUserComponent },
  {path:'admin',component: LoginComponent},
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
    canActivate: [authGuard],
  },
  {
    path: 'SA',
    loadChildren: () =>
      import('./superadmin/superadmin.module').then((m) => m.SuperadminModule),
    canActivate: [authGuard],
  },
];
