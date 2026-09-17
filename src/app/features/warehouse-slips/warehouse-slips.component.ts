import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { WarehouseSlip, WarehouseSlipItem } from '../../core/models/models';

@Component({
  selector: 'app-warehouse-slips',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './warehouse-slips.component.html',
  styleUrls: ['./warehouse-slips.component.css'],
})
export class WarehouseSlipsComponent implements OnInit {
  slips: WarehouseSlip[] = [];
  printingSlip: WarehouseSlip | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  private readonly printStyleId = 'warehouse-slip-print-style';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.api.getWarehouseSlips().subscribe({
      next: (slips) => {
        this.slips = slips;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Không thể tải danh sách phiếu xuất kho.';
        this.isLoading = false;
      },
    });
  }

  trackBySlipId(index: number, slip: WarehouseSlip): number {
    return slip.warehouse_slip_id ?? index;
  }

  trackByItemStt(_index: number, item: WarehouseSlipItem): number {
    return item.stt;
  }

  printSlip(slip: WarehouseSlip): void {
    this.printingSlip = slip;
    const originalTitle = document.title;
    document.title = `Phieu xuat kho - ${slip.ky_hieu || slip.warehouse_slip_id || 'moi'}`;

    // Chèn CSS toàn cục (nằm ngoài phạm vi scoped-style của Angular)
    // để ẩn được mọi thứ trên trang, kể cả header/menu điều hướng
    // nằm ở component layout khác, chỉ giữ lại phiếu cần in.
    this.injectGlobalPrintStyle();

    const restorePrintState = () => {
      this.printingSlip = null;
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
        .print-slip-sheet,
        .print-slip-sheet * { visibility: visible !important; }
        .print-slip-sheet {
          position: absolute !important;
          left: 0;
          top: 0;
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
        }
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