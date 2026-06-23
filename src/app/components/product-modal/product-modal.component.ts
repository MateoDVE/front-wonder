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
              <label>Volumen (ml)</label>
              <input 
                type="number" 
                formControlName="volumen_ml" 
                placeholder="Ej. 750"
              >
            </div>

            <div class="form-group">
              <label>Graduación Alcohólica (%)</label>
              <input 
                type="number" 
                formControlName="gradacion_alcoholica" 
                placeholder="Ej. 40"
                step="0.1"
              >
            </div>
          </div>

          <div class="form-group">
            <label>Tipo de Bebida</label>
            <input 
              type="text" 
              formControlName="tipo_bebida" 
              placeholder="Ej. Whisky, Licor, Cerveza"
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
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 200ms ease-out;
    }

    .modal-content {
      background: var(--clr-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--clr-border);
      padding: 2.5rem;
      width: 90%;
      max-width: 520px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: var(--shadow-modal);
      animation: popIn 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--clr-text-1);
    }

    .close-btn {
      background: var(--clr-surface-2);
      border: 1px solid var(--clr-border);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      font-size: 1.2rem;
      cursor: pointer;
      color: var(--clr-text-2);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: var(--clr-border);
      color: var(--clr-text-1);
      transform: scale(1.05);
    }

    .product-form {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
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
      height: 180px;
      border: 2px dashed var(--clr-border);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: var(--clr-surface-2);
      transition: all 0.2s;
      overflow: hidden;
    }

    .image-preview:hover {
      border-color: var(--clr-primary);
      background: var(--clr-accent);
    }

    .image-preview.has-image {
      border: 1px solid var(--clr-border);
      background: transparent;
      cursor: pointer;
    }

    .image-preview.has-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: var(--radius-md);
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--clr-text-2);
    }

    .upload-placeholder svg {
      color: var(--clr-text-3);
    }

    .upload-placeholder p {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .upload-progress {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background: var(--clr-surface-2);
      border-radius: var(--radius-pill);
      overflow: hidden;
    }

    .progress-bar::after {
      content: '';
      display: block;
      height: 100%;
      background: var(--clr-primary);
      animation: progress 1.5s ease-in-out infinite;
    }

    @keyframes progress {
      0% { width: 0%; }
      50% { width: 100%; }
      100% { width: 0%; }
    }

    .upload-error {
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.15);
      color: #ef4444;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      text-align: center;
      font-weight: 600;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: 700;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      color: var(--clr-text-1);
    }

    .form-group input[type="text"],
    .form-group input[type="number"],
    .form-group textarea,
    .form-group select {
      padding: 0.75rem 1rem;
      border: 1px solid var(--clr-border);
      background: var(--clr-surface);
      color: var(--clr-text-1);
      border-radius: var(--radius-md);
      font-size: 0.95rem;
      font-family: inherit;
      transition: all 0.2s;
      outline: none;
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      border-color: var(--clr-primary);
      box-shadow: 0 0 0 3px var(--clr-accent);
    }

    .form-group small {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      font-weight: 500;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group input[type="checkbox"] {
      margin-right: 0.6rem;
      cursor: pointer;
      width: 16px;
      height: 16px;
      accent-color: var(--clr-primary);
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
      padding: 0.75rem 1.25rem;
      border: none;
      border-radius: var(--radius-pill);
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel {
      background: var(--clr-surface-2);
      color: var(--clr-text-2);
      border: 1px solid var(--clr-border);
    }

    .btn-cancel:hover {
      background: var(--clr-border);
      color: var(--clr-text-1);
    }

    .btn-submit {
      background: var(--btn-gradient);
      color: white;
      box-shadow: var(--shadow-sm);
    }

    .btn-submit:hover:not(:disabled) {
      opacity: 0.95;
      transform: translateY(-0.5px);
      box-shadow: var(--shadow-md);
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-message {
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.15);
      color: #ef4444;
      padding: 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      text-align: center;
      font-weight: 600;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes popIn {
      from { opacity: 0; transform: scale(0.97) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    @media (max-width: 480px) {
      .modal-content {
        padding: 1.5rem 1.25rem;
        border-radius: var(--radius-md);
      }
      .form-row {
        grid-template-columns: 1fr;
        gap: 1.2rem;
      }
      .modal-header {
        margin-bottom: 1.5rem;
      }
      .form-actions {
        margin-top: 1.2rem;
      }
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
      volumen_ml: [null],
      gradacion_alcoholica: [null],
      tipo_bebida: [''],
    });
  }

  private cleanUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const lower = url.trim().toLowerCase();
    if (lower === 'null' || lower === 'undefined' || lower === '') return null;
    return url;
  }

  open(product?: Producto): void {
    this.error.set(null);
    this.uploadError.set(null);
    this.imagePreview.set(null);
    
    if (product) {
      this.editingProduct.set(product);
      const sanitizedUrl = this.cleanUrl(product.imagen_url);
      this.imagePreview.set(sanitizedUrl);
      this.form.patchValue({
        nombre: product.nombre,
        precio_venta: product.precio_venta,
        stock: product.stock,
        descripcion: product.descripcion,
        categoria_id: product.categoria_id,
        marca: product.marca,
        activo: product.activo,
        destacado: product.destacado,
        imagen_url: sanitizedUrl || '',
        volumen_ml: product.volumen_ml,
        gradacion_alcoholica: product.gradacion_alcoholica,
        tipo_bebida: product.tipo_bebida || '',
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
        volumen_ml: formValue.volumen_ml !== null && formValue.volumen_ml !== '' ? Number(formValue.volumen_ml) : undefined,
        gradacion_alcoholica: formValue.gradacion_alcoholica !== null && formValue.gradacion_alcoholica !== '' ? Number(formValue.gradacion_alcoholica) : undefined,
        tipo_bebida: formValue.tipo_bebida || undefined,
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
