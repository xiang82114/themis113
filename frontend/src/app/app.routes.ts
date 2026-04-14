import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home/home-page.component';
import { AboutPageComponent } from './pages/about/about-page.component';
import { ProcessPageComponent } from './pages/process/process-page.component';
import { FaqPageComponent } from './pages/faq/faq-page.component';
import { WorksPageComponent } from './pages/works/works-page.component';
import { WorkDetailPageComponent } from './pages/work-detail/work-detail-page.component';
import { ContactPageComponent } from './pages/contact/contact-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'about', component: AboutPageComponent },
  { path: 'process', component: ProcessPageComponent },
  { path: 'faq', component: FaqPageComponent },
  { path: 'works', component: WorksPageComponent },
  { path: 'works/:slug', component: WorkDetailPageComponent },
  { path: 'contact', component: ContactPageComponent },
  { path: '**', redirectTo: '' }
];
