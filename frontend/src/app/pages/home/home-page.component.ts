import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkService } from '../../core/services/work.service';
import { Work } from '../../core/models/work.model';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  private readonly workService = inject(WorkService);
  readonly works = signal<Work[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.workService.getAll().subscribe({
      next: (data) => {
        this.works.set(data.slice(0, 3));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
