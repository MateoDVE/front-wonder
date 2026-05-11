import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { UploadService } from '../../services/upload.service';
import { Producto } from '../../types/database.types';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen()" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ editingProduct() ? 'Editar Producto' : 'Crear Producto' }}</h2>
          <button class="close-btn" (click)="closeModal()">×</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="product-form">
          <!-- Image Upload Section -->
          <div class="form-group image-section">
            <label>Imagen del Producto</label>
            
            <div class="image-preview-container">
              <div 
                class="image-preview" 
                [class.has-image]="imagePreview()"
                (click)="fileInput.click()"
              >
                <img *ngIf="imagePreview()" [src]="imagePreview()" alt="Vista previa">
                <div *ngIf="!imagePreview()" class="upload-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <p>Click para subir imagen</p>
                </div>
              </div>
              
              <input 
                #fileInput
                type="file" 
                accept="image/*"
                style="display: none;"
                (change)="onImageSelected($event)"
              >

              <div *ngIf="uploading()" class="upload-progress">
                <div class="progress-bar"></div>
                <small>Subiendo imagen...</small>
              </div>

              <div *ngIf="uploadError()" class="upload-error">
                {{ uploadError() }}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Nombre</label>
            <input 
              type="text" 
              formControlName="nombre" 
              placeholder="Nombre del producto"
              required
            >
            <small *ngIf="form.get('nombre')?.hasError('required') && form.get('nombre')?.touched">
              El nombre es requerido
            </small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Precio</label>
              <input 
                type="number" 
                formControlName="precio_venta"
                placeholder="0.00"
                required
                step="0.01"
              >
              <small *ngIf="form.get('precio_venta')?.hasError('required') && form.get('precio_venta')?.touched">
                El precio es requerido
              </small>
            </div>

            <div class="form-group">
              <label>Stock</label>
              <input 
                type="number" 
                formControlName="stock" 
                placeholder="0"
                required
              >
              <small *ngIf="form.get('stock')?.hasError('required') && form.get('stock')?.touched">
                El stock es requerido
              </small>
            </div>
          </div>

          <div class="form-group">
            <label>Categoría</label>
            <select formControlName="categoria_id">
              <option value="">Seleccionar categoría</option>
              <option *ngFor="let cat of categorias()" [value]="cat.id">
                {{ cat.nombre }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Descripción</label>
            <textarea 
              formControlName="descripcion" 
              placeholder="Descripción del producto"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Marca</label>
            <input 
              type="text" 
              formControlName="marca" 
              placeholder="Marca"
            >
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>
                <input type="checkbox" formControlName="activo">
                Activo
              </label>
            </div>

            <div class="form-group">
              <label>
                <input type="checkbox" formControlName="destacado">
                Destacado
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" (click)="closeModal()" class="btn-cancel">
              Cancelar
            </button>
            <button 
              type="submit" 
              [disabled]="!form.valid || isLoading() || uploading()"
              class="btn-submit"
            >
              {{ isLoading() ? 'Guardando...' : (editingProduct() ? 'Actualizar' : 'Crear') }}
            </button>
          </div>

          <div *ngIf="error()" class="error-message">
            {{ error() }}
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #999;
      transition: color 0.2s;
    }

    .close-btn:hover {
      color: #333;
    }

    .product-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .image-section {
      order: -1;
    }

    .image-preview-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .image-preview {
      width: 100%;
      height: 200px;
      border: 2px dashed #ddd;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: #fafafa;
      transition: all 0.2s;
      overflow: hidden;
    }

    .image-preview:hover {
      border-color: #66CC00;
      background: #f5fff5;
    }

    .image-preview.has-image {
      border: none;
      background: transparent;
      cursor: pointer;
    }

    .image-preview.has-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 6px;
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: #999;
    }

    .upload-placeholder svg {
      color: #ddd;
    }

    .upload-placeholder p {
      margin: 0;
      font-size: 0.875rem;
    }

    .upload-progress {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background: #f0f0f0;
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-bar::after {
      content: '';
      display: block;
      height: 100%;
      background: #66CC00;
      animation: progress 1.5s ease-in-out infinite;
    }

    @keyframes progress {
      0% { width: 0%; }
      50% { width: 100%; }
      100% { width: 0%; }
    }

    .upload-error {
      background: #ffebee;
      color: #d32f2f;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      text-align: center;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .form-group input[type="text"],
    .form-group input[type="number"],
    .form-group textarea,
    .form-group select {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: #66CC00;
      box-shadow: 0 0 0 3px rgba(102, 204, 0, 0.1);
    }

    .form-group small {
      color: #d32f2f;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group input[type="checkbox"] {
      margin-right: 0.5rem;
      cursor: pointer;
    }

    .form-group label {
      display: flex;
      align-items: center;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .btn-cancel,
    .btn-submit {
      flex: 1;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel {
      background: #f0f0f0;
      color: #333;
    }

    .btn-cancel:hover {
      background: #e0e0e0;
    }

    .btn-submit {
      background: #66CC00;
      color: white;
    }

    .btn-submit:hover:not(:disabled) {
      background: #55bb00;
      box-shadow: 0 4px 12px rgba(102, 204, 0, 0.3);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error-message {
      background: #ffebee;
      color: #d32f2f;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem;
      margin-top: 1rem;
    }
  `]
})
export class ProductModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly uploadService = inject(UploadService);

  readonly isOpen = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingProduct = signal<Producto | null>(null);
  readonly categorias = this.categoryService.categorias;
  
  readonly imagePreview = signal<string | null>(null);
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      precio_venta: [0, [Validators.required]],
      stock: [0, [Validators.required]],
      descripcion: [''],
      categoria_id: [null],
      marca: [''],
      activo: [true],
      destacado: [false],
      imagen_url: [''],
    });
  }

  open(product?: Producto): void {
    this.error.set(null);
    this.uploadError.set(null);
    this.imagePreview.set(null);
    
    if (product) {
      this.editingProduct.set(product);
      this.imagePreview.set(product.imagen_url || null);
      this.form.patchValue({
        nombre: product.nombre,
        precio_venta: product.precio_venta,
        stock: product.stock,
        descripcion: product.descripcion,
        categoria_id: product.categoria_id,
        marca: product.marca,
        activo: product.activo,
        destacado: product.destacado,
        imagen_url: product.imagen_url || '',
      });
    } else {
      this.editingProduct.set(null);
      this.form.reset({ activo: true, destacado: false });
    }
    this.isOpen.set(true);
  }

  closeModal(): void {
    this.isOpen.set(false);
    this.editingProduct.set(null);
    this.error.set(null);
    this.uploadError.set(null);
    this.imagePreview.set(null);
    this.form.reset();
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.uploadError.set('Solo se permiten archivos de imagen');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError.set('La imagen no debe exceder 5MB');
      return;
    }

    this.uploading.set(true);
    this.uploadError.set(null);

    try {
      const response = await this.uploadService.uploadImage(file, 'producto');
      
      this.imagePreview.set(response.data.url);
      this.form.patchValue({ imagen_url: response.data.url });
      
      // Reset file input
      input.value = '';
    } catch (err: any) {
      this.uploadError.set(err?.error?.message || 'Error al subir la imagen');
      console.error('[ProductModal]', err);
      input.value = '';
    } finally {
      this.uploading.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.form.valid) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const formValue = this.form.value;
      const editing = this.editingProduct();

      const payload: any = {
        nombre: formValue.nombre,
        precio_venta: Number(formValue.precio_venta),
        stock: Number(formValue.stock),
        categoria_id: formValue.categoria_id ? Number(formValue.categoria_id) : undefined,
        descripcion: formValue.descripcion || undefined,
        marca: formValue.marca || undefined,
        activo: formValue.activo,
        destacado: formValue.destacado,
        imagen_url: formValue.imagen_url || undefined,
      };

      if (editing) {
        await this.productService.update(editing.id, payload);
      } else {
        await this.productService.create(payload);
      }

      this.closeModal();
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Error al guardar el producto');
    } finally {
      this.isLoading.set(false);
    }
  }
}
