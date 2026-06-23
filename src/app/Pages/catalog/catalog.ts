import { Component, OnInit, computed, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { Producto } from '../../types/database.types';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { ProductDetailModalComponent } from '../../components/product-detail-modal/product-detail-modal';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
  imports: [ProductCardComponent, ProductDetailModalComponent],
})
export class CatalogPage implements OnInit {

  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly cartService = inject(CartService);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly loading = computed(() =>
    this.productService.loading() || this.categoryService.loading(),
  );
  readonly error = computed(() => this.productService.error() || this.categoryService.error());
  readonly productos = this.productService.productos;
  readonly categorias = this.categoryService.categorias;
  readonly categoriasNames = computed(() =>
    this.categorias().map(cat => cat.nombre),
  );



  readonly activeBrand = signal('');
  readonly marcas = computed(() => {
    const list = this.productos()
      .map(p => p.marca?.trim())
      .filter((m): m is string => !!m);
    return [...new Set(list)].sort((a, b) => a.localeCompare(b));
  });

  readonly selectedProduct = signal<Producto | null>(null);
  readonly searchTerm = signal('');
  readonly activeCategory = signal('');
  readonly addingToCart = signal(false);
  readonly showFilters = signal(false);
  readonly sortBy = signal<'name' | 'priceAsc' | 'priceDesc'>('name');

  readonly queryProductId = signal<number | null>(null);

  // Pagination
  readonly pageSize = 12;
  readonly currentPage = signal(1);

  readonly paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredProducts().slice(start, end);
  });

  readonly totalPages = computed(() => {
    return Math.ceil(this.filteredProducts().length / this.pageSize);
  });

  constructor() {
    this.route.queryParams.subscribe(params => {
      const category = params['category'];
      const productId = Number(params['product']);

      this.currentPage.set(1); // Reset page on category link change

      if (category) {
        this.activeCategory.set(category);
        this.scrollToProducts();
      } else {
        this.activeCategory.set('');
      }

      if (productId) {
        this.queryProductId.set(productId);
        this.scrollToProducts();
      } else {
        this.queryProductId.set(null);
      }
    });

    effect(() => {
      const prodId = this.queryProductId();
      const list = this.productos();
      if (prodId && list.length > 0) {
        const prod = list.find(p => p.id === prodId);
        if (prod) {
          this.selectedProduct.set(prod);
        }
      }
    });
  }

  private scrollToProducts(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        const el = document.getElementById('catalog-products');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150); // Small timeout to ensure DOM update
    }
  }

  readonly filteredProducts = computed(() => {
    let list = this.productService.filterByTerm(this.searchTerm());

    // 1. Filter by category
    const cat = this.activeCategory();
    if (cat) {
      const categoryObj = this.categorias().find(c => c.nombre === cat);
      const catId = categoryObj?.id;
      if (catId) {
        list = list.filter(p => p.categoria_id === catId || p.categoria?.nombre === cat);
      } else {
        list = list.filter(p => p.categoria?.nombre === cat);
      }
    }

    // 1.5. Filter by brand
    const brand = this.activeBrand();
    if (brand) {
      list = list.filter(p => p.marca?.trim().toLowerCase() === brand.toLowerCase());
    }

    // 2. Sort results
    const sort = this.sortBy();
    if (sort === 'name') {
      list = [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (sort === 'priceAsc') {
      list = [...list].sort((a, b) => a.precio_venta - b.precio_venta);
    } else if (sort === 'priceDesc') {
      list = [...list].sort((a, b) => b.precio_venta - a.precio_venta);
    }

    return list;
  });

  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  setSort(sort: 'name' | 'priceAsc' | 'priceDesc'): void {
    this.sortBy.set(sort);
    this.currentPage.set(1);
  }

  ngOnInit(): void {
    this.productService.loadAll();
    this.categoryService.loadAll();
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onCategoryToggle(cat: string): void {
    this.activeCategory.update(c => (c === cat ? '' : cat));
    this.currentPage.set(1);
  }

  onBrandToggle(brand: string): void {
    this.activeBrand.update(b => (b === brand ? '' : brand));
    this.currentPage.set(1);
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

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const numbers: number[] = [];
    for (let i = 1; i <= total; i++) {
      numbers.push(i);
    }
    return numbers;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.scrollToProducts();
    }
  }

}
