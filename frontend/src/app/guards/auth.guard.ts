import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is logged in, prevent access to login/signup
  if (authService.isLoggedIn()) {
    const user = authService.getCurrentUser();

    if (user) {
      const roleRoutes: any = {
        user: '/my-complaints',
        staff: '/department-complaints',
        admin: '/all-complaints',
      };

      const redirectRoute = roleRoutes[user.role];

      if (redirectRoute) {
        router.navigate([redirectRoute]);
      }
    }

    return false; // Block navigation
  }

  return true; // Allow navigation if not logged in
};
