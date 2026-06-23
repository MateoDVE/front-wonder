import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Producto } from '../../types/database.types';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-detail-modal',
  templateUrl: './product-detail-modal.html',
  styleUrl: './product-detail-modal.scss',
  imports: [CommonModule, CurrencyPipe],
})
export class ProductDetailModalComponent {
  private readonly cartService = inject(CartService);

  @Input({ required: true }) product!: Producto;
  @Output() close = new EventEmitter<void>();

  readonly cantidad = signal(1);
  readonly addingToCart = signal(false);
  imgError = false;

  readonly subtotal = computed(() => this.product.precio_venta * this.cantidad());

  get categoryLabel(): string {
    return this.product.categoria?.nombre ?? this.product.tipo_bebida ?? 'Licor';
  }

  get cleanedImageUrl(): string | null {
    const url = this.product.imagen_url;
    if (!url) return null;
    const lower = url.trim().toLowerCase();
    if (lower === 'null' || lower === 'undefined' || lower === '') return null;
    return url;
  }

  get inStock(): boolean {
    return this.product.stock > 0;
  }

  onImgError(): void {
    this.imgError = true;
  }

  increment(): void {
    if (this.cantidad() < this.product.stock) {
      this.cantidad.update(c => c + 1);
    }
  }

  decrement(): void {
    if (this.cantidad() > 1) {
      this.cantidad.update(c => c - 1);
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  async onAddToCart(): Promise<void> {
    if (!this.inStock || this.addingToCart()) return;
    
    this.addingToCart.set(true);
    try {
      await this.cartService.addItem(this.product, this.cantidad());
      this.onClose();
    } catch (err) {
      console.error('Error al agregar al carrito:', err);
    } finally {
      this.addingToCart.set(false);
    }
  }
}
