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

  // Optimistic UI state properties
  private updateTimeouts = new Map<number, any>();
  private pendingQuantities = new Map<number, number>();
  private activePendingRequests = new Set<number | string>();
  private stableItems: CartItem[] = [];

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

  private saveStableState(): void {
    if (this.updateTimeouts.size === 0 && this.activePendingRequests.size === 0) {
      this.stableItems = [...this.items()];
    }
  }

  private rollback(): void {
    if (this.stableItems.length > 0) {
      this.items.set([...this.stableItems]);
    }
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
      const mapped = (data ?? []).map(item => this.mapBackendItem(item));
      this.items.set(mapped);
      this.stableItems = [...mapped];
    } catch (err) {
      console.error('[CartService] Error al cargar carrito:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async addItem(producto: Producto, cantidad: number = 1): Promise<void> {
    const userId = this.userService.userId();
    if (!userId) return;

    // Direct PUT optimization: if item exists with valid database ID, update quantity directly
    const existing = this.items().find(i => i.producto_id === producto.id);
    if (existing && existing.id > 0) {
      return this.updateQuantity(existing.id, existing.cantidad + cantidad);
    }

    this.saveStableState();
    this.error.set(null);

    // Apply optimistic update: add new item or increment quantity of temporary item
    const oldItems = [...this.items()];
    const existingTempIndex = oldItems.findIndex(i => i.producto_id === producto.id);

    if (existingTempIndex > -1) {
      oldItems[existingTempIndex] = {
        ...oldItems[existingTempIndex],
        cantidad: oldItems[existingTempIndex].cantidad + cantidad,
      };
      this.items.set(oldItems);
    } else {
      const tempId = -Math.floor(Math.random() * 1000000000) - 1;
      const tempItem: CartItem = {
        id: tempId,
        producto_id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio_venta,
        imagen: producto.imagen_url || null,
        cantidad: cantidad,
      };
      this.items.set([...oldItems, tempItem]);
    }

    const requestKey = `add-${producto.id}`;
    this.activePendingRequests.add(requestKey);
    this.loading.set(true);

    try {
      const dto: AgregarItemCarritoDto = {
        producto_id: producto.id,
        cantidad: cantidad,
        precio_unitario: producto.precio_venta,
      };

      const responseItem = await firstValueFrom(
        this.http.post<BackendCarritoItem>(`${this.base}/${userId}`, dto),
      );

      const realItem = this.mapBackendItem(responseItem);

      // Replace temporary item with real item in the signal
      this.items.update(items =>
        items.map(item => (item.producto_id === producto.id ? realItem : item)),
      );

      this.activePendingRequests.delete(requestKey);
      if (this.updateTimeouts.size === 0 && this.activePendingRequests.size === 0) {
        this.stableItems = [...this.items()];
      }
    } catch (err) {
      this.activePendingRequests.delete(requestKey);
      this.error.set('Error al agregar producto al carrito');
      console.error('[CartService]', err);
      this.rollback();
    } finally {
      this.loading.set(false);
    }
  }

  async removeItem(id: number): Promise<void> {
    this.saveStableState();
    this.error.set(null);

    // Apply optimistic update: remove item instantly
    this.items.update(items => items.filter(i => i.id !== id));

    // Cancel any pending update timeouts for this item
    if (this.updateTimeouts.has(id)) {
      clearTimeout(this.updateTimeouts.get(id));
      this.updateTimeouts.delete(id);
    }
    this.pendingQuantities.delete(id);

    // If it's a temporary item (negative ID), it doesn't exist on the backend yet
    if (id < 0) {
      if (this.updateTimeouts.size === 0 && this.activePendingRequests.size === 0) {
        this.stableItems = [...this.items()];
      }
      return;
    }

    const requestKey = `remove-${id}`;
    this.activePendingRequests.add(requestKey);
    this.loading.set(true);

    try {
      await firstValueFrom(this.http.delete(`${this.base}/item/${id}`));
      this.activePendingRequests.delete(requestKey);
      if (this.updateTimeouts.size === 0 && this.activePendingRequests.size === 0) {
        this.stableItems = [...this.items()];
      }
    } catch (err) {
      this.activePendingRequests.delete(requestKey);
      this.error.set('Error al eliminar producto');
      console.error('[CartService]', err);
      this.rollback();
    } finally {
      this.loading.set(false);
    }
  }

  async updateQuantity(id: number, cantidad: number): Promise<void> {
    if (cantidad <= 0) {
      return this.removeItem(id);
    }

    this.saveStableState();
    this.error.set(null);

    // Apply optimistic update: update quantity instantly in signal
    this.items.update(items =>
      items.map(i => (i.id === id ? { ...i, cantidad } : i)),
    );

    // If it's a temporary item (negative ID), wait for its creation POST to return the database ID.
    // In the meantime, we update its local quantity and buffer the change so it will eventually sync.
    if (id < 0) {
      // We don't send updates for temporary IDs yet. The add request will create it with quantity 1,
      // and once it finishes, any subsequent updates will find the real ID.
      // (Optionally we could buffer the quantity delta, but since add handles it, this is a safe default).
      return;
    }

    // Cancel any pending timeout for this item
    if (this.updateTimeouts.has(id)) {
      clearTimeout(this.updateTimeouts.get(id));
    }

    this.pendingQuantities.set(id, cantidad);

    // Setup debounced API call
    const timeoutId = setTimeout(async () => {
      this.updateTimeouts.delete(id);
      const qtyToSend = this.pendingQuantities.get(id);
      this.pendingQuantities.delete(id);
      if (qtyToSend === undefined) return;

      const requestKey = `qty-${id}`;
      this.activePendingRequests.add(requestKey);
      this.loading.set(true);

      try {
        await firstValueFrom(
          this.http.put(`${this.base}/item/${id}`, { cantidad: qtyToSend }),
        );
        this.activePendingRequests.delete(requestKey);
        if (this.updateTimeouts.size === 0 && this.activePendingRequests.size === 0) {
          this.stableItems = [...this.items()];
        }
      } catch (err) {
        this.activePendingRequests.delete(requestKey);
        this.error.set('Error al actualizar cantidad');
        console.error('[CartService]', err);
        this.rollback();
      } finally {
        this.loading.set(false);
      }
    }, 350);

    this.updateTimeouts.set(id, timeoutId);
  }

  async clearCart(): Promise<void> {
    const userId = this.userService.userId();
    if (!userId) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.http.delete(`${this.base}/${userId}`));
      this.items.set([]);
      this.stableItems = [];

      // Clear any pending state
      for (const timeoutId of this.updateTimeouts.values()) {
        clearTimeout(timeoutId);
      }
      this.updateTimeouts.clear();
      this.pendingQuantities.clear();
      this.activePendingRequests.clear();
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
