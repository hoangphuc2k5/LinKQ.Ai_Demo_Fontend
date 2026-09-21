import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="nav">
      <a routerLink="/upload" routerLinkActive="active">Tải & Phân tích ảnh</a>
      <a routerLink="/ocr" routerLinkActive="active">Đọc văn bản từ ảnh</a>
      <a routerLink="/warehouse-slips" routerLinkActive="active">Phiếu xuất kho</a>
      <a routerLink="/warehouse-slips/list" routerLinkActive="active">Danh sách phiếu xuất kho</a>
      <a routerLink="/transactions" routerLinkActive="active">Danh sách giao dịch</a>
      <a routerLink="/customers" routerLinkActive="active">Danh mục khách hàng</a>
      <a routerLink="/payment-orders" routerLinkActive="active">Đơn thanh toán</a>
    </nav>
    <router-outlet></router-outlet>
  `,
  styles: [`
    .nav { display: flex; gap: 16px; padding: 16px; background: #111827; }
    .nav a { color: #cbd5e1; text-decoration: none; font-family: system-ui, sans-serif; }
    .nav a.active { color: white; font-weight: 600; }
  `],
})
export class AppComponent {}
