import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);

  // During SSR/prerender we allow rendering; browser navigation is still protected.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getUser();
  const isAdmin = (user?.rol ?? '').toLowerCase() === 'admin';

  if (isAdmin) {
    return true;
  }

  return router.createUrlTree(['/']);
};
