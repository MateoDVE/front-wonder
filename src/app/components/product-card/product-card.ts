import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Producto } from '../../types/database.types';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  imports: [CurrencyPipe],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Producto;
  @Output() addToCart = new EventEmitter<Producto>();

  imgError = false;

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

  onAddToCart(): void {
    this.addToCart.emit(this.product);
  }
}
