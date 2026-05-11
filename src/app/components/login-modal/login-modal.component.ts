import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  template: `
  <div class="modal-backdrop" (click)="onBackdropClick($event)">
    <section class="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <button class="login-modal__close" type="button" (click)="close()" aria-label="Cerrar modal">
        <span aria-hidden="true">×</span>
      </button>

      <div class="login-modal__brand">
        <div class="login-modal__badge">Wonder</div>
        <h3 id="login-title">Inicia sesión</h3>
        <p>Accede a tu cuenta para comprar más rápido, revisar pedidos y guardar tus favoritos.</p>

        <ul class="login-modal__benefits">
          <li>Checkout más rápido</li>
          <li>Historial de pedidos</li>
          <li>Control de tu carrito</li>
        </ul>
      </div>

      <div class="login-modal__content">
        <form class="login-form" [formGroup]="form" (ngSubmit)="submit()">
          <label class="login-form__field">
            <span class="login-form__label">Correo electrónico</span>
            <input formControlName="email" type="email" placeholder="tu@email.com" />
            <small *ngIf="form.controls.email.invalid && form.controls.email.touched" class="login-form__error">
              Ingresa un correo válido.
            </small>
          </label>

          <label class="login-form__field">
            <span class="login-form__label">Contraseña</span>
            <input formControlName="password" type="password" placeholder="••••••••" />
            <small *ngIf="form.controls.password.invalid && form.controls.password.touched" class="login-form__error">
              La contraseña debe tener al menos 6 caracteres.
            </small>
          </label>

          <div class="login-form__meta">
            <label class="login-form__remember">
              <input type="checkbox" />
              <span>Recordarme</span>
            </label>

            <button type="button" class="login-form__link">¿Olvidaste tu contraseña?</button>
          </div>

          <p *ngIf="error" class="login-form__alert">{{ error }}</p>

          <div class="login-form__actions">
            <button type="submit" class="login-form__submit" [disabled]="loading">
              {{ loading ? 'Ingresando...' : 'Entrar' }}
            </button>
            <button type="button" class="login-form__cancel" (click)="close()">Cancelar</button>
          </div>
        </form>
      </div>
    </section>
  </div>
  `,
  styles: [
    `
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 24px;
      background:
        radial-gradient(circle at top, rgba(102, 204, 0, 0.18), transparent 30%),
        rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(16px);
      animation: fadeIn 180ms ease-out;
    }

    .login-modal {
      position: relative;
      width: min(920px, 100%);
      display: grid;
      grid-template-columns: 0.95fr 1.05fr;
      overflow: hidden;
      border: 1px solid var(--clr-border);
      border-radius: 28px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 249, 251, 0.98));
      box-shadow: var(--shadow-modal);
      transform-origin: center;
      animation: popIn 220ms cubic-bezier(0.2, 0.8, 0.2, 1);

      :root.dark & {
        background: linear-gradient(180deg, rgba(26, 31, 46, 0.98), rgba(20, 24, 36, 0.98));
      }
    }

    .login-modal__close {
      position: absolute;
      top: 18px;
      right: 18px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      color: var(--clr-text-2);
      background: rgba(255, 255, 255, 0.82);
      border: 1px solid var(--clr-border);
      box-shadow: var(--shadow-xs);
      transition:
        transform var(--ease),
        background-color var(--ease),
        color var(--ease);
      z-index: 2;

      :root.dark & {
        background: rgba(15, 23, 42, 0.72);
      }

      &:hover {
        transform: scale(1.05);
        color: var(--clr-text-1);
      }
    }

    .login-modal__brand {
      padding: 40px 36px;
      background:
        linear-gradient(135deg, rgba(102, 204, 0, 0.12), rgba(31, 77, 0, 0.08)),
        var(--clr-surface-2);
      border-right: 1px solid var(--clr-border);
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 18px;

      h3 {
        font-size: clamp(2rem, 3vw, 2.7rem);
        line-height: 1;
        letter-spacing: -0.04em;
        color: var(--clr-text-1);
      }

      p {
        max-width: 32ch;
        color: var(--clr-text-2);
        font-size: 0.98rem;
      }
    }

    .login-modal__badge {
      width: fit-content;
      padding: 7px 14px;
      border-radius: var(--radius-pill);
      background: var(--btn-gradient);
      color: #fff;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      box-shadow: var(--shadow-sm);
    }

    .login-modal__benefits {
      list-style: none;
      display: grid;
      gap: 10px;
      margin-top: 8px;

      li {
        position: relative;
        padding-left: 26px;
        color: var(--clr-text-1);
        font-weight: 500;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.46rem;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--clr-primary);
          box-shadow: 0 0 0 4px var(--clr-accent);
        }
      }
    }

    .login-modal__content {
      padding: 40px 36px;
      display: flex;
      align-items: center;
      background: var(--clr-surface);
    }

    .login-form {
      width: 100%;
      display: grid;
      gap: 18px;
    }

    .login-form__field {
      display: grid;
      gap: 8px;

      input {
        width: 100%;
        height: 48px;
        padding: 0 14px;
        border: 1px solid var(--clr-border);
        border-radius: 14px;
        background: var(--clr-surface-2);
        color: var(--clr-text-1);
        outline: none;
        transition:
          border-color var(--ease),
          box-shadow var(--ease),
          background-color var(--ease);

        &::placeholder {
          color: var(--clr-text-3);
        }

        &:focus {
          border-color: var(--clr-primary);
          box-shadow: 0 0 0 4px var(--clr-accent);
          background: var(--clr-surface);
        }
      }
    }

    .login-form__label {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--clr-text-1);
    }

    .login-form__error {
      color: #b91c1c;
      font-size: 0.82rem;
      line-height: 1.2;
    }

    .login-form__meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .login-form__remember {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--clr-text-2);
      font-size: 0.92rem;

      input {
        width: 16px;
        height: 16px;
        accent-color: var(--clr-primary);
      }
    }

    .login-form__link {
      color: var(--clr-primary-light);
      font-weight: 700;
      font-size: 0.92rem;
      transition: color var(--ease);

      &:hover {
        color: var(--clr-primary-dark);
      }
    }

    .login-form__alert {
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid rgba(185, 28, 28, 0.18);
      background: rgba(185, 28, 28, 0.08);
      color: #b91c1c;
      font-size: 0.92rem;
    }

    .login-form__actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 4px;
    }

    .login-form__submit,
    .login-form__cancel {
      min-height: 46px;
      padding: 0 20px;
      border-radius: var(--radius-pill);
      font-weight: 700;
      transition:
        transform var(--ease),
        background-color var(--ease),
        border-color var(--ease),
        color var(--ease);
    }

    .login-form__submit {
      background: var(--btn-gradient);
      color: #fff;
      box-shadow: var(--shadow-md);

      &:hover {
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.75;
        cursor: not-allowed;
        transform: none;
      }
    }

    .login-form__cancel {
      border: 1px solid var(--clr-border);
      background: var(--clr-surface-2);
      color: var(--clr-text-1);

      &:hover {
        border-color: var(--clr-primary);
        color: var(--clr-primary-dark);
      }
    }

    @media (max-width: 860px) {
      .login-modal {
        grid-template-columns: 1fr;
      }

      .login-modal__brand {
        padding: 32px 28px 24px;
        border-right: none;
        border-bottom: 1px solid var(--clr-border);
      }

      .login-modal__content {
        padding: 28px;
      }
    }

    @media (max-width: 540px) {
      .modal-backdrop {
        padding: 14px;
      }

      .login-modal__brand,
      .login-modal__content {
        padding-inline: 20px;
      }

      .login-modal__close {
        top: 14px;
        right: 14px;
      }

      .login-form__actions {
        flex-direction: column;
      }

      .login-form__submit,
      .login-form__cancel {
        width: 100%;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes popIn {
      from {
        opacity: 0;
        transform: translateY(18px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    `,
  ],
})
export class LoginModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<any>();

  form: any;

  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private userService: UserService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit() {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { email, password } = this.form.value as { email: string; password: string };
    this.auth.login(email!, password!).subscribe({
      next: (res: any) => {
        if (res?.accessToken && res?.user) {
          this.auth.setToken(res.accessToken);
          this.auth.setUser(res.user);
          if (typeof res.user.id === 'number') {
            this.userService.setUserId(res.user.id);
          }
          this.loginSuccess.emit(res.user);
          this.close();
        } else if (res?.message) {
          this.error = res.message;
        } else {
          this.error = 'Respuesta inesperada del servidor';
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Error al iniciar sesión';
        this.loading = false;
      },
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  close() {
    this.closeModal.emit();
  }
}
