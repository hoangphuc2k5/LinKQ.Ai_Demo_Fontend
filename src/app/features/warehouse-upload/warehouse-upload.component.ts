import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { WarehouseSlip } from '../../core/models/models';

@Component({
  selector: 'app-warehouse-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './warehouse-upload.component.html',
  styleUrls: ['./warehouse-upload.component.css'],
})
export class WarehouseUploadComponent {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  warehouseSlip: WarehouseSlip | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  private readonly printStyleId = 'warehouse-slip-print-style';

  constructor(private api: ApiService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.selectedFile = input.files[0];
    this.warehouseSlip = null;
    this.errorMessage = null;
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(this.selectedFile);
  }

  analyze(): void {
    if (!this.selectedFile) return;
    this.isLoading = true;
    this.errorMessage = null;
    this.api.analyzeWarehouseSlip(this.selectedFile).subscribe({
      next: (slip) => {
        this.warehouseSlip = slip;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Có lỗi xảy ra khi tạo phiếu xuất kho.';
        this.isLoading = false;
      },
    });
  }

  get formattedNgayLap(): string {
    const raw = this.warehouseSlip?.ngay_lap;
    if (!raw) return '—';
    // Một số dữ liệu trả về dạng ISO đầy đủ (2026-09-16T17:00:00.000Z),
    // ở đây chỉ cần hiển thị phần ngày (yyyy-MM-dd).
    return raw.includes('T') ? raw.split('T')[0] : raw;
  }

  reset(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.warehouseSlip = null;
    this.errorMessage = null;
  }

  print(): void {
    if (!this.warehouseSlip) return;
    const originalTitle = document.title;
    document.title = `Phieu xuat kho - ${this.warehouseSlip.ky_hieu || this.warehouseSlip.warehouse_slip_id || 'moi'}`;

    // Chèn CSS toàn cục (nằm ngoài phạm vi scoped-style của Angular)
    // để ẩn được mọi thứ trên trang, kể cả header/menu điều hướng
    // nằm ở component layout khác, chỉ giữ lại phiếu cần in.
    this.injectGlobalPrintStyle();

    const restorePrintState = () => {
      document.title = originalTitle;
      this.removeGlobalPrintStyle();
      window.removeEventListener('afterprint', restorePrintState);
    };

    window.addEventListener('afterprint', restorePrintState);
    window.setTimeout(() => window.print(), 0);
  }

  private injectGlobalPrintStyle(): void {
    this.removeGlobalPrintStyle();

    const style = document.createElement('style');
    style.id = this.printStyleId;
    style.textContent = `
      @media print {
        @page { size: A4 portrait; margin: 0; }
        html, body {
          width: 210mm;
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
        }
        body * { visibility: hidden !important; }
        .warehouse-slip,
        .warehouse-slip * { visibility: visible !important; }
        .warehouse-slip {
          position: absolute !important;
          left: 0;
          top: 0;
          width: 210mm;
          min-height: 297mm;
          max-width: none;
          margin: 0 !important;
          border: 0 !important;
          box-sizing: border-box;
        }
        .print-slip-code button { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  private removeGlobalPrintStyle(): void {
    const existing = document.getElementById(this.printStyleId);
    if (existing) {
      existing.remove();
    }
  }
}