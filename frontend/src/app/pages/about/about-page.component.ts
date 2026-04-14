import { Component } from '@angular/core';

@Component({
  selector: 'app-about-page',
  template: `
    <section class="content">
      <h1>關於我們</h1>
      <p>THEMIS 專注於住宅與商空的整體規劃，從需求訪談到完工監造，提供完整設計流程。</p>
      <p>我們重視生活動線、材質語彙與照明層次，讓空間在日常中更好用也更耐看。</p>
    </section>
  `,
  styles: '.content{max-width:780px;line-height:1.9;color:#425254}'
})
export class AboutPageComponent {}
