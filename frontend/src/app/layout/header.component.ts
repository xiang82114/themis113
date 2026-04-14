import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="site-header">
      <a routerLink="/" class="brand">THEMIS DESIGN</a>
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">首頁</a>
        <a routerLink="/about" routerLinkActive="active">關於我們</a>
        <a routerLink="/process" routerLinkActive="active">服務流程</a>
        <a routerLink="/works" routerLinkActive="active">作品集</a>
        <a routerLink="/faq" routerLinkActive="active">FAQ</a>
        <a routerLink="/contact" routerLinkActive="active">聯絡我們</a>
      </nav>
    </header>
  `,
  styles: `
    .site-header {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1rem 2rem;
      border-bottom: 1px solid #e8e8e8;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
    }
    .brand {
      font-size: 1.1rem;
      letter-spacing: 0.08em;
      font-weight: 700;
      color: #2b3a3a;
      text-decoration: none;
    }
    nav {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    nav a {
      color: #455a64;
      text-decoration: none;
      font-size: 0.9rem;
    }
    nav a.active {
      color: #0b6358;
      font-weight: 700;
    }
  `
})
export class HeaderComponent {}
