import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { WorkService } from '../../core/services/work.service';
import { Work } from '../../core/models/work.model';

@Component({
  selector: 'app-work-detail-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './work-detail-page.component.html',
  styleUrl: './work-detail-page.component.scss'
})
export class WorkDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly workService = inject(WorkService);

  readonly work = signal<Work | undefined>(undefined);
  readonly loading = signal(true);

  constructor() {
    this.route.paramMap
      .pipe(switchMap((params) => this.workService.getBySlug(params.get('slug') || '')))
      .subscribe({
        next: (data) => {
          this.work.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }
}
