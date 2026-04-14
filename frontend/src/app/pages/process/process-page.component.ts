import { Component } from '@angular/core';

@Component({
  selector: 'app-process-page',
  template: `
    <section class="content">
      <h1>服務流程</h1>
      <ol>
        <li>需求訪談與現場丈量</li>
        <li>平面配置與風格提案</li>
        <li>3D 模擬與材質定稿</li>
        <li>工程報價與施工排程</li>
        <li>監工驗收與完工交付</li>
      </ol>
    </section>
  `,
  styles: '.content{max-width:780px;line-height:1.9;color:#425254}'
})
export class ProcessPageComponent {}
