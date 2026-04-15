import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg fixed-top navbar-custom" [class.navbar-transparent]="isTransparent()" [class.navbar-colored]="!isTransparent()">
      <div class="container">
        <a class="navbar-brand" routerLink="/" (click)="closeMenu()">
          <img [src]="logoSrc()" alt="THEMIS DESIGN" />
        </a>

        <button
          class="navbar-toggler"
          type="button"
          [attr.aria-expanded]="menuOpen()"
          [class.collapsed]="!menuOpen()"
          (click)="toggleMenu()"
          aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse justify-content-end" [class.show]="menuOpen()">
          <ul class="navbar-nav">
            <li class="nav-item"><a class="nav-link me-lg-3" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMenu()">首頁</a></li>
            <li class="nav-item"><a class="nav-link me-lg-3" routerLink="/about" routerLinkActive="active" (click)="closeMenu()">關於我們</a></li>
            <li class="nav-item"><a class="nav-link me-lg-3" routerLink="/works" routerLinkActive="active" (click)="closeMenu()">設計作品</a></li>
            <li class="nav-item"><a class="nav-link me-lg-3" routerLink="/process" routerLinkActive="active" (click)="closeMenu()">服務流程</a></li>
            <li class="nav-item"><a class="nav-link me-lg-3" routerLink="/faq" routerLinkActive="active" (click)="closeMenu()">常見問題</a></li>
            <li class="nav-item"><a class="nav-link me-lg-3" routerLink="/contact" routerLinkActive="active" (click)="closeMenu()">聯繫我們</a></li>
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: `
    .navbar-custom {
      transition: background-color .3s ease, box-shadow .3s ease;
      padding-top: .52rem;
      padding-bottom: .52rem;
    }

    .navbar-brand img {
      height: 45px;
      transition: all .3s ease;
    }

    .navbar-transparent {
      background-color: transparent !important;
      box-shadow: none;
    }

    .navbar-colored {
      background-color: rgba(248, 240, 230, 0.98) !important;
      box-shadow: 0 6px 14px rgba(0, 0, 0, .06);
      border-bottom: 1px solid rgba(90, 74, 63, 0.12);
    }

    .nav-link {
      position: relative;
      font-size: .85rem;
      letter-spacing: 0.02em;
      padding-top: .2rem;
      padding-bottom: .2rem;
      transition: color .28s ease, letter-spacing .28s ease;
    }

    .nav-link::after {
      content: "";
      position: absolute;
      left: 50%;
      bottom: -4px;
      width: 0;
      height: 2px;
      background: #a08974;
      transform: translateX(-50%);
      border-radius: 2px;
      transition: width .32s ease;
      box-shadow: 0 0 6px rgba(160,137,116,.35);
    }

    .navbar-transparent .nav-link { color: #f8f0e6 !important; }
    .navbar-colored .nav-link { color: #5a4a3f !important; }

    .nav-link:hover {
      color: #a08974 !important;
      letter-spacing: .04em;
    }

    .nav-link:hover::after,
    .nav-link.active::after {
      width: 72%;
    }

    .nav-link.active {
      color: #a08974 !important;
    }

    .navbar-toggler {
      border-color: rgba(90,74,63,.18);
      background-color: rgba(248,240,230,.92);
      border-radius: 10px;
      padding: .35rem .5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,.08);
    }

    .navbar-toggler:focus {
      box-shadow: 0 0 0 .18rem rgba(160,137,116,.2);
    }

    .navbar-toggler-icon {
      background-image: none;
      position: relative;
      width: 1.3rem;
      height: 1.3rem;
    }

    .navbar-toggler-icon::before {
      content: "\\F479";
      font-family: bootstrap-icons;
      font-size: 1.15rem;
      line-height: 1.3rem;
      color: #5a4a3f;
    }

    @media (max-width: 991.98px) {
      .navbar-brand img { height: 40px; }

      .navbar-transparent .navbar-toggler {
        background-color: transparent;
        border-color: transparent;
        box-shadow: none;
      }

      .navbar-transparent .navbar-toggler-icon::before {
        color: #f8f0e6;
      }

      .navbar-custom .navbar-collapse {
        margin-top: .6rem;
        padding: .65rem .8rem;
        border-radius: 12px;
      }

      .navbar-colored .navbar-collapse {
        border: 1px solid rgba(90,74,63,.12);
        background-color: #f8f0e6;
        box-shadow: 0 10px 24px rgba(0,0,0,.12);
      }

      .navbar-transparent .navbar-collapse {
        border: 0;
        box-shadow: none;
        background-color: transparent;
      }

      .navbar-nav .nav-link {
        border-radius: 8px;
        padding: .45rem .65rem;
      }

      .navbar-colored .navbar-nav .nav-link:hover,
      .navbar-colored .navbar-nav .nav-link:focus {
        background-color: rgba(160,137,116,.13);
      }
    }
  `
})
export class HeaderComponent {
  private readonly router = inject(Router);

  private readonly isHome = signal(this.router.url === '/');
  private readonly isScrolled = signal(typeof window !== 'undefined' ? window.scrollY > 50 : false);
  readonly menuOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        const url = event.urlAfterRedirects.split('?')[0];
        this.isHome.set(url === '/');
        this.isScrolled.set(window.scrollY > 50);
        this.menuOpen.set(false);
      });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 50);
  }

  isTransparent(): boolean {
    return this.isHome() && !this.isScrolled();
  }

  logoSrc(): string {
    return this.isTransparent() ? '/images/logo/logoNocolor.png' : '/images/logo/logocolor-green.png';
  }

  toggleMenu(): void {
    this.menuOpen.set(!this.menuOpen());
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
