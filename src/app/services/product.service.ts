import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Producto } from '../types/database.types';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base = `${environment.apiUrl}/productos`;

  readonly productos = signal<Producto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(
        this.http.get<Producto[]>(this.base, { params: { activo: 'true' } }),
      );
      this.productos.set(data ?? []);
    } catch (err) {
      this.error.set('No se pudieron cargar los productos.');
      console.error('[ProductService]', err);
    } finally {
      this.loading.set(false);
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  async create(producto: Omit<Producto, 'id'>): Promise<Producto> {
    try {
      const result = await firstValueFrom(
        this.http.post<Producto>(this.base, producto, {
          headers: this.getAuthHeaders(),
        }),
      );
      this.productos.update(p => [...p, result]);
      return result;
    } catch (err) {
      const message = 'Error al crear producto';
      this.error.set(message);
      console.error('[ProductService]', err);
      throw err;
    }
  }

  async update(id: number, producto: Partial<Producto>): Promise<Producto> {
    try {
      const result = await firstValueFrom(
        this.http.put<Producto>(`${this.base}/${id}`, producto, {
          headers: this.getAuthHeaders(),
        }),
      );
      this.productos.update(p => p.map(prod => prod.id === id ? result : prod));
      return result;
    } catch (err) {
      const message = 'Error al actualizar producto';
      this.error.set(message);
      console.error('[ProductService]', err);
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
      this.productos.update(p => p.filter(prod => prod.id !== id));
    } catch (err) {
      const message = 'Error al eliminar producto';
      this.error.set(message);
      console.error('[ProductService]', err);
      throw err;
    }
  }

  filterByTerm(term: string): Producto[] {
    const t = term.toLowerCase().trim();
    if (!t) return this.productos();
    return this.productos().filter(
      p =>
        p.nombre.toLowerCase().includes(t) ||
        (p.marca ?? '').toLowerCase().includes(t) ||
        (p.tipo_bebida ?? '').toLowerCase().includes(t) ||
        (p.categoria?.nombre ?? '').toLowerCase().includes(t),
    );
  }

  getCategorias(): string[] {
    const nombres = this.productos()
      .map(p => p.categoria?.nombre ?? p.tipo_bebida ?? '')
      .filter(Boolean);
    return [...new Set(nombres)];
  }
}
