import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { CheckoutService, CheckoutRequest } from '../../services/checkout.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-cart-modal',
  templateUrl: './cart-modal.html',
  styleUrl: './cart-modal.scss',
  imports: [CurrencyPipe],
})
export class CartModalComponent {
  readonly cart = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly userService = inject(UserService);

  readonly isCheckingOut = signal(false);
  readonly checkoutError = signal<string | null>(null);

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cart.close();
    }
  }

  async onUpdateQuantity(itemId: number, cantidad: number): Promise<void> {
    await this.cart.updateQuantity(itemId, cantidad);
  }

  async onInputChange(itemId: number, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    if (isNaN(value) || value < 1) {
      // Don't update cart yet if it's empty, user might be typing
      return;
    }
    await this.cart.updateQuantity(itemId, value);
  }

  async onInputBlur(itemId: number, event: Event, currentQty: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    if (isNaN(value) || value < 1) {
      // Restore valid quantity on blur if left invalid
      input.value = currentQty.toString();
      await this.cart.updateQuantity(itemId, currentQty);
    }
  }

  async onRemoveItem(itemId: number): Promise<void> {
    await this.cart.removeItem(itemId);
  }

  async onCheckout(): Promise<void> {
    const userId = this.userService.userId();
    if (!userId || this.cart.items().length === 0) return;

    this.isCheckingOut.set(true);
    this.checkoutError.set(null);

    try {
      const request: CheckoutRequest = {
        usuarioId: userId,
        total: this.cart.total(),
        items: this.cart.items().map(item => ({
          productoId: item.producto_id,
          cantidad: item.cantidad,
          precio: item.precio,
        })),
      };

      // Intentar crear el pedido en la base de datos
      const response = await this.checkoutService.createOrder(request);

      // Formatear mensaje con ID de pedido
      let mensaje = `¡Hola, Wonder! Quisiera completar mi Pedido #${response.id}:\n\n`;
      mensaje += `*Detalle del Pedido:*\n`;
      this.cart.items().forEach(item => {
        const subtotal = item.precio * item.cantidad;
        mensaje += `• ${item.cantidad} x ${item.nombre} (Bs. ${item.precio.toFixed(2)} c/u) -> Bs. ${subtotal.toFixed(2)}\n`;
      });
      mensaje += `\n*Total a Pagar:* Bs. ${this.cart.total().toFixed(2)}\n\n`;
      mensaje += `¡Muchas gracias!`;

      const whatsappUrl = `https://api.whatsapp.com/send/?phone=59175957633&text=${encodeURIComponent(mensaje)}&type=phone_number&app_absent=0`;

      // Vaciar carrito y cerrar modal
      await this.cart.clearCart();
      this.cart.close();

      // Redirigir a WhatsApp
      if (typeof window !== 'undefined') {
        window.open(whatsappUrl, '_blank');
      }
    } catch (err) {
      console.error('[CartModal] Error al crear pedido en BD, usando checkout directo a WhatsApp:', err);
      
      // Fallback: Si el backend falla, permitimos la compra directa por WhatsApp para no perder al cliente
      let mensaje = `¡Hola, Wonder! Quisiera realizar el siguiente pedido:\n\n`;
      mensaje += `*Detalle del Pedido:*\n`;
      this.cart.items().forEach(item => {
        const subtotal = item.precio * item.cantidad;
        mensaje += `• ${item.cantidad} x ${item.nombre} (Bs. ${item.precio.toFixed(2)} c/u) -> Bs. ${subtotal.toFixed(2)}\n`;
      });
      mensaje += `\n*Total a Pagar:* Bs. ${this.cart.total().toFixed(2)}\n\n`;
      mensaje += `¡Muchas gracias!`;

      const whatsappUrl = `https://api.whatsapp.com/send/?phone=59175957633&text=${encodeURIComponent(mensaje)}&type=phone_number&app_absent=0`;

      await this.cart.clearCart();
      this.cart.close();

      if (typeof window !== 'undefined') {
        window.open(whatsappUrl, '_blank');
      }
    } finally {
      this.isCheckingOut.set(false);
    }
  }
}
