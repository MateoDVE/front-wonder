import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../core/config/api-url';

export interface CheckoutRequest {
  usuarioId: string;
  total: number;
  items: Array<{
    productoId: number;
    cantidad: number;
    precio: number;
  }>;
  notas?: string;
}

export interface CheckoutResponse {
  id: number;
  usuario_id: string;
  total: number;
  estado: 'pendiente' | 'confirmado' | 'enviado' | 'entregado' | 'cancelado';
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/pedidos`;

  async createOrder(request: CheckoutRequest): Promise<CheckoutResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<CheckoutResponse>(this.base, {
          usuario_id: request.usuarioId,
          total: request.total,
          items: request.items.map(item => ({
            producto_id: item.productoId,
            cantidad: item.cantidad,
            precio: item.precio,
          })),
          notas: request.notas,
        }),
      );
      return response;
    } catch (err) {
      console.error('[CheckoutService] Error al crear pedido:', err);
      throw new Error('No se pudo procesar el pedido');
    }
  }

  async getOrderById(id: number): Promise<CheckoutResponse> {
    return firstValueFrom(this.http.get<CheckoutResponse>(`${this.base}/${id}`));
  }

  async getUserOrders(usuarioId: string): Promise<CheckoutResponse[]> {
    return firstValueFrom(
      this.http.get<CheckoutResponse[]>(`${this.base}/usuario/${usuarioId}`),
    );
  }
}
