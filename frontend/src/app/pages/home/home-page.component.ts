import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface FeaturedWork {
  title: string;
  subtitle: string;
  image: string;
  slug: string;
}

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  readonly slides = ['/images/hero-bgc.jpg', '/images/hero-bgc2.jpg', '/images/hero-bgc3.jpg'];

  readonly featuredWorks: FeaturedWork[] = [
    { title: '藍調玩心', subtitle: 'Playful Blues', image: '/images/ThemisWeb/H/H01.jpg', slug: 'themis-modern' },
    { title: '日常拾光', subtitle: 'Everyday Gleams', image: '/images/ThemisWeb/K-D/01.jpg', slug: 'japanwood' },
    { title: '晨光靜語', subtitle: 'Whispers of Dawn', image: '/images/ThemisWeb/L/L01.jpg', slug: 'themis-modern' },
    { title: '慢暖居', subtitle: 'Warmth in Stillness', image: '/images/ThemisWeb/K-W/K-W03.jpg', slug: 'japanwood' },
    { title: '柔白純境', subtitle: 'Pure White Serenity', image: '/images/ThemisWeb/W/W01.jpg', slug: 'themis-modern' },
    { title: '和煦靜好', subtitle: 'Tranquil Radiance', image: '/images/ThemisWeb/S-T/S-T01.jpg', slug: 'japanwood' }
  ];

  readonly processLeft = [
    ['01', '設計諮詢', '經客戶彙整基本需求後，由設計師電訪，安排諮詢會議'],
    ['02', '現場丈量／諮詢', '勘查結構、水電、採光與動線，釐清限制與需求優先度'],
    ['03', '初步提案（平面配置）', '提供平面配置與動線建議，評估初步工程費用'],
    ['04', '設計合約簽訂', '確認服務範疇、進度與付款節點，開始深化設計'],
    ['05', '設計規劃（3D／材質／機電）', '建立 3D 示意、材質樣本、照明及插座配置，細部討論']
  ];

  readonly processRight = [
    ['06', '設計定案', '確認各空間尺寸與細節，凍結圖說與工程預算'],
    ['07', '工程合約／排程', '確認工期、分段驗收與付款節點，施工前說明'],
    ['08', '工程準備', '料件下單、工班安排、社區施工申請與電梯使用申請'],
    ['09', '施工管理／進度回報', '定期會勘與里程碑驗收，提供進度照片與重點提醒'],
    ['10', '完工驗收／保固', '完工清潔與交屋，提供保固與使用說明，後續維護諮詢']
  ];
}
