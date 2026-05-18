import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { API_BASE_URL } from '../core/config/api-url';
import { Categoria } from '../types/database.types';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base = `${API_BASE_URL}/categorias`;

  readonly categorias = signal<Categoria[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private loadSeq = 0;

  async loadAll(options?: { onlyActive?: boolean }): Promise<void> {
    const seq = ++this.loadSeq;
    this.loading.set(true);
    this.error.set(null);
    try {
      const onlyActive = options?.onlyActive ?? true;
      const params = onlyActive ? { activa: 'true' } : undefined;
      const data = await firstValueFrom(
        this.http.get<Categoria[]>(this.base, { params }).pipe(timeout(10000)),
      );
      if (seq !== this.loadSeq) return;
      this.categorias.set(data ?? []);
    } catch (err) {
      if (seq !== this.loadSeq) return;
      this.error.set('No se pudieron cargar las categorías.');
      console.error('[CategoryService]', err);
    } finally {
      if (seq === this.loadSeq) this.loading.set(false);
    }
  }

  async getById(id: number): Promise<Categoria> {
    return firstValueFrom(this.http.get<Categoria>(`${this.base}/${id}`));
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  async create(categoria: Omit<Categoria, 'id'>): Promise<Categoria> {
    try {
      const result = await firstValueFrom(
        this.http.post<Categoria>(this.base, categoria, {
          headers: this.getAuthHeaders(),
        }),
      );
      this.categorias.update(c => [...c, result]);
      return result;
    } catch (err) {
      const message = 'Error al crear categoría';
      this.error.set(message);
      console.error('[CategoryService]', err);
      throw err;
    }
  }

  async update(id: number, categoria: Partial<Categoria>): Promise<Categoria> {
    try {
      const result = await firstValueFrom(
        this.http.put<Categoria>(`${this.base}/${id}`, categoria, {
          headers: this.getAuthHeaders(),
        }),
      );
      this.categorias.update(c => c.map(cat => cat.id === id ? result : cat));
      return result;
    } catch (err) {
      const message = 'Error al actualizar categoría';
      this.error.set(message);
      console.error('[CategoryService]', err);
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
      this.categorias.update(c => c.filter(cat => cat.id !== id));
    } catch (err) {
      const message = 'Error al eliminar categoría';
      this.error.set(message);
      console.error('[CategoryService]', err);
      throw err;
    }
  }
}
