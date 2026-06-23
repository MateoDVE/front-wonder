import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CarruselService } from '../../services/carrusel.service';
import { UploadService } from '../../services/upload.service';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { CarruselImagen } from '../../types/database.types';

@Component({
  selector: 'app-carrusel-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen()" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ editingSlide() ? 'Editar Diapositiva' : 'Nueva Diapositiva' }}</h2>
          <button class="close-btn" (click)="closeModal()">×</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="carrusel-form">
          <!-- Image Upload Section -->
          <div class="form-group image-section">
            <label>Imagen del Banner</label>
            
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
            <label>Título (Opcional)</label>
            <input 
              type="text" 
              formControlName="titulo" 
              placeholder="Título principal superpuesto"
            >
          </div>

          <div class="form-group">
            <label>Descripción (Opcional)</label>
            <textarea 
              formControlName="descripcion" 
              placeholder="Texto descriptivo o subtítulo"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Acción del botón al hacer clic</label>
            <select formControlName="link_type" style="padding: 0.75rem 1rem; border: 1px solid var(--clr-border); background: var(--clr-surface); color: var(--clr-text-1); border-radius: var(--radius-md, 8px); font-size: 0.95rem; outline: none; margin-bottom: 0.25rem;">
              <option value="none">Ninguna (Sin botón)</option>
              <option value="category">Filtrar por Categoría</option>
              <option value="product">Abrir Detalle de un Producto</option>
              <option value="external">Ir a un enlace web personalizado</option>
            </select>
          </div>

          <div class="form-group" *ngIf="form.get('link_type')?.value === 'category'">
            <label>Selecciona la Categoría</label>
            <select formControlName="link_category" style="padding: 0.75rem 1rem; border: 1px solid var(--clr-border); background: var(--clr-surface); color: var(--clr-text-1); border-radius: var(--radius-md, 8px); font-size: 0.95rem; outline: none;">
              <option value="">-- Elige una categoría --</option>
              <option *ngFor="let cat of categories()" [value]="cat.nombre">{{ cat.nombre }}</option>
            </select>
          </div>

          <div class="form-group" *ngIf="form.get('link_type')?.value === 'product'">
            <label>Selecciona el Producto</label>
            <select formControlName="link_product" style="padding: 0.75rem 1rem; border: 1px solid var(--clr-border); background: var(--clr-surface); color: var(--clr-text-1); border-radius: var(--radius-md, 8px); font-size: 0.95rem; outline: none;">
              <option value="">-- Elige un producto --</option>
              <option *ngFor="let prod of products()" [value]="prod.id">{{ prod.nombre }} ({{ prod.marca || 'Sin marca' }})</option>
            </select>
          </div>

          <div class="form-group" *ngIf="form.get('link_type')?.value === 'external'">
            <label>Dirección Web Externa</label>
            <input 
              type="text" 
              formControlName="link_external" 
              placeholder="Ej. https://facebook.com/tiendawonder"
            >
            <span class="help-text">Escribe la dirección web completa (debe iniciar con http:// o https://).</span>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Orden</label>
              <input 
                type="number" 
                formControlName="orden" 
                placeholder="0"
                min="0"
              >
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="activo">
                Activa
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" (click)="closeModal()" class="btn-cancel">
              Cancelar
            </button>
            <button 
              type="submit" 
              [disabled]="!form.valid || isLoading() || uploading() || !form.value.imagen_url"
              class="btn-submit"
            >
              {{ isLoading() ? 'Guardando...' : (editingSlide() ? 'Actualizar' : 'Crear') }}
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
      border-radius: var(--radius-lg, 16px);
      border: 1px solid var(--clr-border);
      padding: 2.5rem;
      width: 90%;
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-modal, 0 20px 25px -5px rgba(0,0,0,0.1));
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

    .carrusel-form {
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
      height: 200px;
      border: 2px dashed var(--clr-border);
      border-radius: var(--radius-md, 8px);
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
    }

    .image-preview.has-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: var(--radius-md, 8px);
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
      border-radius: 9999px;
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

    .form-row {
      display: flex;
      gap: 1.5rem;
      align-items: flex-end;
    }

    .flex-1 {
      flex: 1;
    }

    .checkbox-group {
      padding-bottom: 0.75rem;
    }

    .form-group label {
      font-weight: 700;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      color: var(--clr-text-1);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }

    .form-group input[type="text"],
    .form-group input[type="number"],
    .form-group textarea {
      padding: 0.75rem 1rem;
      border: 1px solid var(--clr-border);
      background: var(--clr-surface);
      color: var(--clr-text-1);
      border-radius: var(--radius-md, 8px);
      font-size: 0.95rem;
      font-family: inherit;
      transition: all 0.2s;
      outline: none;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      border-color: var(--clr-primary);
      box-shadow: 0 0 0 3px var(--clr-accent);
    }

    .form-group input[type="checkbox"] {
      margin-right: 0.6rem;
      cursor: pointer;
      width: 18px;
      height: 18px;
      accent-color: var(--clr-primary);
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
      border-radius: var(--radius-pill, 9999px);
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

    .form-group small {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      font-weight: 500;
    }

    .form-group .help-text {
      color: var(--clr-text-2);
      font-size: 0.78rem;
      margin-top: 0.35rem;
      line-height: 1.35;
      font-weight: 500;
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
      }
      .modal-header {
        margin-bottom: 1.5rem;
      }
      .form-actions {
        margin-top: 1.2rem;
      }
      .form-row {
        flex-direction: column;
        align-items: stretch;
        gap: 1.2rem;
      }
    }
  `]
})
export class CarruselModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly carruselService = inject(CarruselService);
  private readonly uploadService = inject(UploadService);
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);

  readonly isOpen = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingSlide = signal<CarruselImagen | null>(null);
  
  readonly imagePreview = signal<string | null>(null);
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  readonly categories = this.categoryService.categorias;
  readonly products = this.productService.productos;

  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      imagen_url: ['', [Validators.required]],
      titulo: [''],
      descripcion: [''],
      link_type: ['none'],
      link_category: [''],
      link_product: [''],
      link_external: [''],
      orden: [0, [Validators.min(0)]],
      activo: [true],
    });
  }

  open(slide?: CarruselImagen): void {
    this.error.set(null);
    this.uploadError.set(null);
    this.imagePreview.set(null);
    
    void this.categoryService.loadAll({ onlyActive: true });
    void this.productService.loadAll({ onlyActive: true });

    if (slide) {
      this.editingSlide.set(slide);
      this.imagePreview.set(slide.imagen_url);
      
      let type: 'none' | 'category' | 'product' | 'external' = 'none';
      let categoryVal = '';
      let productVal = '';
      let externalVal = '';

      if (slide.link_url) {
        if (slide.link_url.includes('category=')) {
          type = 'category';
          const match = slide.link_url.match(/category=([^&]+)/);
          categoryVal = match ? decodeURIComponent(match[1]) : '';
        } else if (slide.link_url.includes('product=')) {
          type = 'product';
          const match = slide.link_url.match(/product=([^&]+)/);
          productVal = match ? match[1] : '';
        } else {
          type = 'external';
          externalVal = slide.link_url;
        }
      }

      this.form.patchValue({
        imagen_url: slide.imagen_url,
        titulo: slide.titulo || '',
        descripcion: slide.descripcion || '',
        link_type: type,
        link_category: categoryVal,
        link_product: productVal,
        link_external: externalVal,
        orden: slide.orden,
        activo: slide.activo,
      });
    } else {
      this.editingSlide.set(null);
      this.form.reset({ activo: true, orden: 0, link_type: 'none' });
    }
    this.isOpen.set(true);
  }

  closeModal(): void {
    this.isOpen.set(false);
    this.editingSlide.set(null);
    this.error.set(null);
    this.uploadError.set(null);
    this.imagePreview.set(null);
    this.form.reset();
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.uploadError.set('Solo se permiten archivos de imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.uploadError.set('La imagen no debe exceder 5MB');
      return;
    }

    this.uploading.set(true);
    this.uploadError.set(null);

    try {
      const response = await this.uploadService.uploadImage(file, 'otro');
      
      this.imagePreview.set(response.data.url);
      this.form.patchValue({ imagen_url: response.data.url });
      
      input.value = '';
    } catch (err: any) {
      this.uploadError.set(err?.error?.message || 'Error al subir la imagen');
      console.error('[CarruselModal]', err);
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
      const editing = this.editingSlide();

      let finalLinkUrl: string | null = null;
      if (formValue.link_type === 'category' && formValue.link_category) {
        finalLinkUrl = `/catalog?category=${encodeURIComponent(formValue.link_category)}`;
      } else if (formValue.link_type === 'product' && formValue.link_product) {
        finalLinkUrl = `/catalog?product=${formValue.link_product}`;
      } else if (formValue.link_type === 'external' && formValue.link_external) {
        finalLinkUrl = formValue.link_external;
      }

      const payload: any = {
        imagen_url: formValue.imagen_url,
        titulo: formValue.titulo || null,
        descripcion: formValue.descripcion || null,
        link_url: finalLinkUrl,
        orden: formValue.orden || 0,
        activo: formValue.activo,
      };

      if (editing) {
        await this.carruselService.update(editing.id, payload);
      } else {
        await this.carruselService.create(payload);
      }

      this.closeModal();
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Error al guardar la diapositiva');
    } finally {
      this.isLoading.set(false);
    }
  }
}
