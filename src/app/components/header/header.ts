import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ThemeService } from '../../services/theme.service';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
  imports: [LoginModalComponent],
})
export class HeaderComponent {
  readonly cart = inject(CartService);
  readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  showLoginModal = false;
  currentUser = this.auth.getUser();

  isAdmin(): boolean {
    const rol = this.currentUser?.rol ?? '';
    return rol.toLowerCase() === 'admin';
  }

  openLogin(): void {
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

    if (this.isAdmin()) {
      void this.router.navigateByUrl('/admin');
    }
  }

  logout(): void {
    this.auth.logout();
    this.currentUser = null;
    void this.router.navigateByUrl('/');
  }
}
