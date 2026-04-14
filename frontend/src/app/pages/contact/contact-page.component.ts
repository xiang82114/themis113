import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactService } from '../../core/services/contact.service';

@Component({
  selector: 'app-contact-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss'
})
export class ContactPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);

  readonly sending = signal(false);
  readonly message = signal('');
  readonly isSuccess = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
    phone: ['', [Validators.maxLength(60)]],
    spaceType: ['', [Validators.required, Validators.maxLength(120)]],
    budget: ['', [Validators.required, Validators.maxLength(120)]],
    square: ['', [Validators.maxLength(120)]],
    wt: ['', [Validators.maxLength(120)]],
    message: ['', [Validators.required, Validators.maxLength(5000)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    this.message.set('');

    this.contactService.submit(this.form.getRawValue() as any).subscribe({
      next: (res) => {
        this.isSuccess.set(true);
        this.message.set(res.message);
        this.sending.set(false);
        this.form.reset();
      },
      error: (err) => {
        this.isSuccess.set(false);
        this.message.set(err?.error?.message ?? '送出失敗，請稍後再試');
        this.sending.set(false);
      }
    });
  }
}
