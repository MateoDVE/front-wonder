import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ThemeService } from '../../services/theme.service';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
  imports: [LoginModalComponent, RouterLink, RouterLinkActive],
})
export class HeaderComponent {
  readonly cart = inject(CartService);
  readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  showLoginModal = false;
  mobileMenuOpen = false;
  currentUser = this.auth.getUser();

  isAdmin(): boolean {
    const rol = this.currentUser?.rol ?? '';
    return rol.toLowerCase() === 'admin';
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  openLogin(): void {
    this.closeMobileMenu();
    if (this.currentUser) {
      if (this.isAdmin()) {
        void this.router.navigateByUrl('/admin');
      }
      return;
    }
    this.showLoginModal = true;
  }

  closeLogin(): void {
    this.showLoginModal = false;
  }

  onLoginSuccess(user: any): void {
    this.currentUser = user ?? this.auth.getUser();
    this.closeLogin();
    this.closeMobileMenu();

    if (this.isAdmin()) {
      void this.router.navigateByUrl('/admin');
    }
  }

  logout(): void {
    this.closeMobileMenu();
    this.auth.logout();
    this.userService.clearUser();
    this.currentUser = null;
    window.location.href = '/';
  }
}
