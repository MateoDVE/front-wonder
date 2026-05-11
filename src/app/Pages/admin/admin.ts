import { Component, OnInit, computed, inject, signal, ViewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ProductModalComponent } from '../../components/product-modal/product-modal.component';
import { CategoryModalComponent } from '../../components/category-modal/category-modal.component';
import { Producto, Categoria } from '../../types/database.types';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CurrencyPipe, ProductModalComponent, CategoryModalComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminPage implements OnInit {
  @ViewChild(ProductModalComponent) productModal!: ProductModalComponent;
  @ViewChild(CategoryModalComponent) categoryModal!: CategoryModalComponent;

  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);

  readonly searchTerm = signal('');
  readonly selectedState = signal<'all' | 'active' | 'inactive' | 'lowStock'>('all');
  readonly activeTab = signal<'products' | 'categories'>('products');

  readonly productos = this.productService.productos;
  readonly categorias = this.categoryService.categorias;
  readonly loading = computed(() => this.productService.loading() || this.categoryService.loading());
  readonly error = computed(() => this.productService.error() || this.categoryService.error());

  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const state = this.selectedState();

    return this.productos().filter((product) => {
      const matchesTerm = !term || [
        product.nombre,
        product.marca ?? '',
        product.tipo_bebida ?? '',
        product.categoria?.nombre ?? '',
      ].some((value) => value.toLowerCase().includes(term));

      const lowStock = product.stock <= (product.stock_minimo ?? 5);
      const matchesState =
        state === 'all' ||
        (state === 'active' && product.activo) ||
        (state === 'inactive' && !product.activo) ||
        (state === 'lowStock' && lowStock);

      return matchesTerm && matchesState;
    });
  });

  readonly totalProducts = computed(() => this.productos().length);
  readonly totalStock = computed(() => this.productos().reduce((sum, product) => sum + (product.stock ?? 0), 0));
  readonly activeProducts = computed(() => this.productos().filter((product) => product.activo).length);
  readonly lowStockProducts = computed(() =>
    this.productos().filter((product) => product.stock <= (product.stock_minimo ?? 5)).length,
  );

  ngOnInit(): void {
    void this.productService.loadAll();
    void this.categoryService.loadAll();
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
    if (!product.activo) return 'Inactive';
    if (product.stock <= (product.stock_minimo ?? 5)) return 'Low stock';
    return 'In stock';
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

  setTab(tab: 'products' | 'categories'): void {
    this.activeTab.set(tab);
  }
}
