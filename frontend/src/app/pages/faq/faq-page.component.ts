import { Component } from '@angular/core';

@Component({
  selector: 'app-faq-page',
  template: `
    <section class="content">
      <h1>常見問題</h1>
      <h3>Q1: 設計到完工大約多久？</h3>
      <p>依坪數與工程內容而定，通常 2-6 個月。</p>
      <h3>Q2: 可以只做設計不施工嗎？</h3>
      <p>可以，提供純設計服務與完整圖面交付。</p>
      <h3>Q3: 初次諮詢需要準備什麼？</h3>
      <p>建議準備平面圖、需求清單與預算範圍。</p>
    </section>
  `,
  styles: '.content{max-width:780px;line-height:1.9;color:#425254}'
})
export class FaqPageComponent {}
