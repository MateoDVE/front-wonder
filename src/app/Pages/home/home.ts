import { Component, OnInit, computed, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { Producto } from '../../types/database.types';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { ProductDetailModalComponent } from '../../components/product-detail-modal/product-detail-modal';
import { CarruselComponent } from '../../components/carrusel/carrusel';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProductCardComponent,
    ProductDetailModalComponent,
    CarruselComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage implements OnInit {
  @ViewChild('featuredContainer') featuredContainer!: ElementRef<HTMLDivElement>;

  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  readonly loading = this.productService.loading;
  readonly error = this.productService.error;
  readonly productos = this.productService.productos;

  readonly destacados = computed(() =>
    this.productos().filter(p => p.destacado && p.activo),
  );

  readonly selectedProduct = signal<Producto | null>(null);
  readonly addingToCart = signal(false);

  ngOnInit(): void {
    this.productService.loadAll();
  }

  async onAddToCart(producto: Producto): Promise<void> {
    this.addingToCart.set(true);
    try {
      await this.cartService.addItem(producto);
    } catch (err) {
      console.error('Error al agregar al carrito:', err);
    } finally {
      this.addingToCart.set(false);
    }
  }

  onViewDetail(producto: Producto): void {
    this.selectedProduct.set(producto);
  }

  scrollFeatured(direction: number): void {
    if (this.featuredContainer) {
      const container = this.featuredContainer.nativeElement;
      const scrollAmount = container.clientWidth * 0.8 * direction;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }
}
