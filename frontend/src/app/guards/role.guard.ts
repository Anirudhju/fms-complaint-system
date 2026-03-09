import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  // Not logged in
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  const allowedRoles = route.data?.['roles'] as string[];

  // If no roles defined, allow
  if (!allowedRoles) return true;

  if (!allowedRoles.includes(user.role)) {
    // Redirect to their correct dashboard
    if (user.role === 'user') {
      router.navigate(['/my-complaints']);
    } else if (user.role === 'staff') {
      router.navigate(['/department-complaints']);
    } else if (user.role === 'admin') {
      router.navigate(['/all-complaints']);
    }
    return false;
  }

  return true;
};
