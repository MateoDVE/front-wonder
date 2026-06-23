import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { API_BASE_URL } from '../core/config/api-url';
import { CarruselImagen } from '../types/database.types';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CarruselService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base = `${API_BASE_URL}/carrusel`;

  readonly carruselImagenes = signal<CarruselImagen[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private loadSeq = 0;

  async loadAll(options?: { onlyActive?: boolean }): Promise<void> {
    const seq = ++this.loadSeq;
    this.loading.set(true);
    this.error.set(null);
    try {
      const onlyActive = options?.onlyActive ?? true;
      const params = onlyActive ? { activo: 'true' } : undefined;
      const data = await firstValueFrom(
        this.http.get<CarruselImagen[]>(this.base, { params }).pipe(timeout(10000)),
      );
      if (seq !== this.loadSeq) return;
      this.carruselImagenes.set(data ?? []);
    } catch (err) {
      if (seq !== this.loadSeq) return;
      this.error.set('No se pudieron cargar las imágenes del carrusel.');
      console.error('[CarruselService]', err);
    } finally {
      if (seq === this.loadSeq) this.loading.set(false);
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  async create(imagen: Omit<CarruselImagen, 'id' | 'created_at' | 'updated_at'>): Promise<CarruselImagen> {
    try {
      const result = await firstValueFrom(
        this.http.post<CarruselImagen>(this.base, imagen, {
          headers: this.getAuthHeaders(),
        }),
      );
      this.carruselImagenes.update(c => [...c, result]);
      return result;
    } catch (err) {
      const message = 'Error al crear imagen de carrusel';
      this.error.set(message);
      console.error('[CarruselService]', err);
      throw err;
    }
  }

  async update(id: number, imagen: Partial<CarruselImagen>): Promise<CarruselImagen> {
    try {
      const result = await firstValueFrom(
        this.http.put<CarruselImagen>(`${this.base}/${id}`, imagen, {
          headers: this.getAuthHeaders(),
        }),
      );
      this.carruselImagenes.update(c => c.map(img => img.id === id ? result : img));
      return result;
    } catch (err) {
      const message = 'Error al actualizar imagen de carrusel';
      this.error.set(message);
      console.error('[CarruselService]', err);
      throw err;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.base}/${id}`, {
          headers: this.getAuthHeaders(),
        }),
      );
      this.carruselImagenes.update(c => c.filter(img => img.id !== id));
    } catch (err) {
      const message = 'Error al eliminar imagen de carrusel';
      this.error.set(message);
      console.error('[CarruselService]', err);
      throw err;
    }
  }
}
