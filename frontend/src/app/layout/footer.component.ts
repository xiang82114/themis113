import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="site-footer">
      <p>THEMIS DESIGN © {{ year }} All rights reserved.</p>
    </footer>
  `,
  styles: `
    .site-footer {
      margin-top: 2rem;
      padding: 1.5rem;
      text-align: center;
      border-top: 1px solid #e8e8e8;
      color: #607d8b;
      font-size: 0.9rem;
    }
  `
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
