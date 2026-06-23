import { Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CarruselService } from '../../services/carrusel.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-carrusel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './carrusel.html',
  styleUrl: './carrusel.scss',
})
export class CarruselComponent implements OnInit, OnDestroy {
  private readonly carruselService = inject(CarruselService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly slides = this.carruselService.carruselImagenes;
  readonly loading = this.carruselService.loading;
  readonly error = this.carruselService.error;

  readonly currentIndex = signal(0);
  private timerId: any = null;
  private readonly intervalTime = 6000; // 6 seconds per slide

  ngOnInit(): void {
    void this.carruselService.loadAll({ onlyActive: true });
    if (this.isBrowser) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  startAutoPlay(): void {
    if (!this.isBrowser) return;
    this.stopAutoPlay();
    this.timerId = setInterval(() => {
      this.nextSlide();
    }, this.intervalTime);
  }

  stopAutoPlay(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  nextSlide(): void {
    const total = this.slides().length;
    if (total === 0) return;
    this.currentIndex.update(index => (index + 1) % total);
  }

  prevSlide(): void {
    const total = this.slides().length;
    if (total === 0) return;
    this.currentIndex.update(index => (index - 1 + total) % total);
  }

  goToSlide(index: number): void {
    this.currentIndex.set(index);
    if (this.isBrowser) {
      this.startAutoPlay(); // Reset timer on manual navigation
    }
  }

  isExternalLink(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  }

  getRoutePath(url: string | null | undefined): string {
    if (!url) return '/';
    if (url.startsWith('/')) {
      const qIndex = url.indexOf('?');
      const path = qIndex !== -1 ? url.substring(0, qIndex) : url;
      if (path === '/' && qIndex !== -1) {
        return '/catalog';
      }
      return path;
    }
    return '/';
  }

  getRouteQueryParams(url: string | null | undefined): Record<string, string> {
    const params: Record<string, string> = {};
    if (!url) return params;
    const qIndex = url.indexOf('?');
    if (qIndex !== -1) {
      const queryString = url.substring(qIndex + 1);
      const pairs = queryString.split('&');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key) {
          params[key] = decodeURIComponent(value || '');
        }
      }
    }
    return params;
  }
}
