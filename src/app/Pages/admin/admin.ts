import { Component, OnInit, computed, inject, signal, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { CarruselService } from '../../services/carrusel.service';
import { ProductModalComponent } from '../../components/product-modal/product-modal.component';
import { CategoryModalComponent } from '../../components/category-modal/category-modal.component';
import { CarruselModalComponent } from '../../components/carrusel-modal/carrusel-modal.component';
import { Producto, Categoria, CarruselImagen } from '../../types/database.types';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CurrencyPipe, ProductModalComponent, CategoryModalComponent, CarruselModalComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminPage implements OnInit {
  @ViewChild(ProductModalComponent) productModal!: ProductModalComponent;
  @ViewChild(CategoryModalComponent) categoryModal!: CategoryModalComponent;
  @ViewChild(CarruselModalComponent) carruselModal!: CarruselModalComponent;

  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly carruselService = inject(CarruselService);

  readonly searchTerm = signal('');
  readonly selectedState = signal<'all' | 'active' | 'inactive' | 'lowStock'>('all');
  readonly activeTab = signal<'products' | 'categories' | 'carrusel'>('products');

  readonly productos = this.productService.productos;
  readonly categorias = this.categoryService.categorias;
  readonly carruselImagenes = this.carruselService.carruselImagenes;
  readonly loading = computed(() => this.productService.loading() || this.categoryService.loading() || this.carruselService.loading());
  readonly error = computed(() => this.productService.error() || this.categoryService.error() || this.carruselService.error());

  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const state = this.selectedState();

    // Resolve category IDs matching the search term
    const matchedCategoryIds = this.categorias()
      .filter(c => c.nombre.toLowerCase().includes(term))
      .map(c => c.id);

    return this.productos().filter((product) => {
      const matchesTerm = !term || [
        product.nombre,
        product.marca ?? '',
        product.tipo_bebida ?? '',
        product.categoria?.nombre ?? '',
      ].some((value) => value.toLowerCase().includes(term)) ||
      (product.categoria_id && matchedCategoryIds.includes(product.categoria_id));

      const lowStock = product.stock <= (product.stock_minimo ?? 5);
      const matchesState =
        state === 'all' ||
        (state === 'active' && product.activo) ||
        (state === 'inactive' && !product.activo) ||
        (state === 'lowStock' && lowStock);

      return matchesTerm && matchesState;
    });
  });

  readonly filteredCategories = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.categorias();
    return this.categorias().filter(c =>
      c.nombre.toLowerCase().includes(term) ||
      (c.descripcion ?? '').toLowerCase().includes(term)
    );
  });

  readonly totalProducts = computed(() => this.productos().length);
  readonly totalStock = computed(() => this.productos().reduce((sum, product) => sum + (product.stock ?? 0), 0));
  readonly activeProducts = computed(() => this.productos().filter((product) => product.activo).length);
  readonly lowStockProducts = computed(() =>
    this.productos().filter((product) => product.stock <= (product.stock_minimo ?? 5)).length,
  );

  ngOnInit(): void {
    void this.productService.loadAll({ onlyActive: false });
    void this.categoryService.loadAll({ onlyActive: false });
    void this.carruselService.loadAll({ onlyActive: false });
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  setState(state: 'all' | 'active' | 'inactive' | 'lowStock'): void {
    this.selectedState.set(state);
  }

  getStockTone(product: Producto): 'good' | 'warn' | 'danger' {
    if (!product.activo) return 'danger';
    if (product.stock <= (product.stock_minimo ?? 5)) return 'warn';
    return 'good';
  }

  getStockLabel(product: Producto): string {
    if (!product.activo) return 'Inactivo';
    if (product.stock <= (product.stock_minimo ?? 5)) return 'Stock bajo';
    return 'En stock';
  }

  // Product CRUD handlers
  openCreateProductModal(): void {
    this.productModal.open();
  }

  editProduct(product: Producto): void {
    this.productModal.open(product);
  }

  async deleteProduct(product: Producto): Promise<void> {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${product.nombre}"?`)) return;
    
    try {
      await this.productService.delete(product.id);
    } catch (err: any) {
      alert(err?.error?.message || 'Error al eliminar el producto');
    }
  }

  // Category CRUD handlers
  openCreateCategoryModal(): void {
    this.categoryModal.open();
  }

  editCategory(category: Categoria): void {
    this.categoryModal.open(category);
  }

  async deleteCategory(category: Categoria): Promise<void> {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${category.nombre}"?`)) return;
    
    try {
      await this.categoryService.delete(category.id);
    } catch (err: any) {
      alert(err?.error?.message || 'Error al eliminar la categoría');
    }
  }

  // Carrusel CRUD handlers
  openCreateCarruselModal(): void {
    this.carruselModal.open();
  }

  editCarrusel(slide: CarruselImagen): void {
    this.carruselModal.open(slide);
  }

  async deleteCarrusel(slide: CarruselImagen): Promise<void> {
    if (!confirm(`¿Estás seguro de que deseas eliminar esta diapositiva?`)) return;
    
    try {
      await this.carruselService.delete(slide.id);
    } catch (err: any) {
      alert(err?.error?.message || 'Error al eliminar la diapositiva');
    }
  }

  setTab(tab: 'products' | 'categories' | 'carrusel'): void {
    this.activeTab.set(tab);
  }
}
