import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BackendCarritoItem, CartItem, Producto } from '../types/database.types';
import { API_BASE_URL } from '../core/config/api-url';
import { UserService } from './user.service';

export interface AgregarItemCarritoDto {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);
  private readonly base = `${API_BASE_URL}/carrito`;

  readonly items = signal<CartItem[]>([]);
  readonly isOpen = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.precio * item.cantidad, 0),
  );

  readonly itemCount = computed(() =>
    this.items().reduce((sum, item) => sum + item.cantidad, 0),
  );

  constructor() {
    // Cargar carrito cuando se establece el usuario
    effect(() => {
      const userId = this.userService.userId();
      if (userId) {
        this.loadCart();
      }
    });
  }

  private mapBackendItem(item: BackendCarritoItem): CartItem {
    return {
      id: item.id,
      producto_id: item.producto_id,
      nombre: item.producto?.nombre ?? 'Producto',
      precio: item.precio_unitario,
      imagen: item.producto?.imagen_url ?? null,
      cantidad: item.cantidad,
    };
  }

  private async loadCart(): Promise<void> {
    const userId = this.userService.userId();
    if (!userId) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(
        this.http.get<BackendCarritoItem[]>(`${this.base}/${userId}`),
      );
      this.items.set((data ?? []).map(item => this.mapBackendItem(item)));
    } catch (err) {
      console.error('[CartService] Error al cargar carrito:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async addItem(producto: Producto): Promise<void> {
    const userId = this.userService.userId();
    if (!userId) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      const dto: AgregarItemCarritoDto = {
        producto_id: producto.id,
        cantidad: 1,
        precio_unitario: producto.precio_venta,
      };
      await firstValueFrom(this.http.post(`${this.base}/${userId}`, dto));
      await this.loadCart();
    } catch (err) {
      this.error.set('Error al agregar producto al carrito');
      console.error('[CartService]', err);
    } finally {
      this.loading.set(false);
    }
  }

  async removeItem(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.http.delete(`${this.base}/item/${id}`));
      this.items.update(items => items.filter(i => i.id !== id));
    } catch (err) {
      this.error.set('Error al eliminar producto');
      console.error('[CartService]', err);
    } finally {
      this.loading.set(false);
    }
  }

  async updateQuantity(id: number, cantidad: number): Promise<void> {
    if (cantidad <= 0) {
      await this.removeItem(id);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(
        this.http.put(`${this.base}/item/${id}`, { cantidad }),
      );
      this.items.update(items =>
        items.map(i => (i.id === id ? { ...i, cantidad } : i)),
      );
    } catch (err) {
      this.error.set('Error al actualizar cantidad');
      console.error('[CartService]', err);
    } finally {
      this.loading.set(false);
    }
  }

  async clearCart(): Promise<void> {
    const userId = this.userService.userId();
    if (!userId) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.http.delete(`${this.base}/${userId}`));
      this.items.set([]);
    } catch (err) {
      this.error.set('Error al vaciar carrito');
      console.error('[CartService]', err);
    } finally {
      this.loading.set(false);
    }
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
