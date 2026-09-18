import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AnalyzeResponse, Customer, CustomerInput, PaymentOrder } from '../../core/models/models';
import { catchError, forkJoin, of } from 'rxjs';

interface TransactionBatchItem {
  file: File;
  previewUrl: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  result: AnalyzeResponse | null;
  error: string | null;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
})
export class UploadComponent {
  selectedFile: File | null = null;
  selectedFiles: File[] = [];
  batchItems: TransactionBatchItem[] = [];
  previewUrl: string | null = null;

  isLoading = false;
  errorMessage: string | null = null;
  result: AnalyzeResponse | null = null;
  matchedCustomer: Customer | null = null;
  customerForm: CustomerInput = this.emptyCustomerForm();
  isSavingCustomer = false;
  isCreatingCustomer = false;
  showCustomerUpdateConfirmation = false;
  paymentOrders: PaymentOrder[] = [];
  isLoadingPaymentOrders = false;
  settlingOrderId: number | null = null;
  paymentConfirmationMessage: string | null = null;

  constructor(private api: ApiService) {}

  get imageBatchItems(): TransactionBatchItem[] {
    return this.batchItems.filter((item) => !!item.previewUrl);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    if (files.some((file) => file.name.toLowerCase().endsWith('.rar'))) {
      input.value = '';
      this.errorMessage = 'Không hỗ trợ file RAR. Vui lòng chọn định dạng tài liệu khác.';
      return;
    }

    this.selectedFiles = files;
    this.batchItems = this.selectedFiles.map((file) => ({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      status: 'PENDING',
      result: null,
      error: null,
    }));
    this.selectedFile = this.selectedFiles[0];
    this.result = null;
    this.errorMessage = null;
    this.paymentConfirmationMessage = null;

    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(this.selectedFile);
  }

  analyze(): void {
    if (!this.selectedFiles.length) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.result = null;
    this.batchItems.forEach((item) => { item.status = 'PROCESSING'; item.error = null; });

    forkJoin(this.batchItems.map((item) => this.api.analyzeImage(item.file).pipe(
      catchError((err) => of({ error: err?.error?.error || 'Có lỗi xảy ra khi phân tích tài liệu.' })),
    ))).subscribe((responses) => {
      responses.forEach((response, index) => {
        const item = this.batchItems[index];
        if ('error' in response) {
          item.status = 'ERROR';
          item.error = response.error;
          return;
        }
        item.status = 'COMPLETED';
        item.result = response;
      });
      const firstCompleted = this.batchItems.find((item) => item.result);
      if (firstCompleted?.result) this.selectBatchResult(firstCompleted);
      this.isLoading = false;
    });
  }

  selectBatchResult(item: TransactionBatchItem): void {
    if (!item.result) return;
    this.selectedFile = item.file;
    this.result = item.result;
    this.setMatchedCustomer(item.result.transaction.MatchedCustomerId);
    this.loadPaymentOrders(item.result.transaction.MatchedCustomerId);
  }

  confirmCandidate(customer: Customer): void {
    if (!this.result) return;
    this.api
      .confirmTransactionCustomer(this.result.transaction.TransactionId, customer.CustomerId)
      .subscribe({
        next: (updated) => {
          this.result!.transaction = updated;
          this.setMatchedCustomer(customer.CustomerId);
          this.loadPaymentOrders(customer.CustomerId);
        },
        error: (err) => {
          this.errorMessage = err?.error?.error || 'Không thể xác nhận khách hàng.';
        },
      });
  }

  saveMatchedCustomer(): void {
    if ((!this.matchedCustomer && !this.isCreatingCustomer) || !this.customerForm.fullName.trim()) return;
    this.showCustomerUpdateConfirmation = true;
  }

  confirmCustomerUpdate(): void {
    this.isSavingCustomer = true;
    this.showCustomerUpdateConfirmation = false;
    const request = this.isCreatingCustomer
      ? this.api.createCustomer(this.customerForm)
      : this.api.updateCustomer(this.matchedCustomer!.CustomerId, this.customerForm);

    request.subscribe({
      next: (customer) => {
        this.matchedCustomer = customer;
        this.isCreatingCustomer = false;
        this.isSavingCustomer = false;
        if (this.result) {
          this.api.confirmTransactionCustomer(this.result.transaction.TransactionId, customer.CustomerId).subscribe({
            next: (updated) => (this.result!.transaction = updated),
            error: (err) => (this.errorMessage = err?.error?.error || 'Không thể gắn khách hàng vào giao dịch.'),
          });
          this.loadPaymentOrders(customer.CustomerId);
        }
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Không thể lưu khách hàng.';
        this.isSavingCustomer = false;
      },
    });
  }

  createNewCustomer(): void {
    const extracted = this.result?.extracted;
    this.isCreatingCustomer = true;
    this.matchedCustomer = null;
    this.customerForm = {
      fullName: extracted?.receiverAccountName || '',
      phone: '',
      email: '',
      bankAccountNumber: extracted?.receiverAccountNumber || '',
      bankName: extracted?.receiverBankName || extracted?.bankName || '',
      accountHolderName: extracted?.receiverAccountName || '',
      note: 'Tạo từ kết quả phân tích tài liệu giao dịch',
    };
  }

  cancelCustomerUpdate(): void {
    this.showCustomerUpdateConfirmation = false;
  }

  settlePaymentOrder(order: PaymentOrder): void {
    if (!this.result || order.Status !== 'PENDING') return;
    this.settlingOrderId = order.PaymentOrderId;
    this.api.settlePaymentOrder(order.PaymentOrderId, this.result.transaction.TransactionId).subscribe({
      next: (updated) => {
        const index = this.paymentOrders.findIndex((item) => item.PaymentOrderId === updated.PaymentOrderId);
        if (index >= 0) this.paymentOrders[index] = { ...this.paymentOrders[index], ...updated, Status: 'PAID' };
        this.settlingOrderId = null;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Không thể đồng bộ đơn thanh toán.';
        this.settlingOrderId = null;
      },
    });
  }

  reset(): void {
    this.batchItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    this.selectedFile = null;
    this.selectedFiles = [];
    this.batchItems = [];
    this.previewUrl = null;
    this.result = null;
    this.matchedCustomer = null;
    this.isCreatingCustomer = false;
    this.customerForm = this.emptyCustomerForm();
    this.showCustomerUpdateConfirmation = false;
    this.paymentOrders = [];
    this.errorMessage = null;
  }

  private setMatchedCustomer(customerId?: number): void {
    if (!customerId || !this.result) {
      this.matchedCustomer = null;
      return;
    }
    const candidate = this.result.matchCandidates.find((item) => item.customer.CustomerId === customerId);
    this.matchedCustomer = candidate?.customer || null;
    if (this.matchedCustomer) {
      this.customerForm = {
        fullName: this.matchedCustomer.FullName || '',
        phone: this.matchedCustomer.Phone || '',
        email: this.matchedCustomer.Email || '',
        bankAccountNumber: this.matchedCustomer.BankAccountNumber || '',
        bankName: this.matchedCustomer.BankName || '',
        accountHolderName: this.matchedCustomer.AccountHolderName || '',
        note: this.matchedCustomer.Note || '',
      };
    }
  }

  private loadPaymentOrders(customerId?: number): void {
    this.paymentOrders = [];
    if (!customerId) return;
    this.isLoadingPaymentOrders = true;
    this.api.getPaymentOrders(customerId).subscribe({
      next: (orders) => {
        this.paymentOrders = orders;
        this.isLoadingPaymentOrders = false;
        this.autoConfirmMatchingPayment(orders);
      },
      error: () => (this.isLoadingPaymentOrders = false),
    });
  }

  private emptyCustomerForm(): CustomerInput {
    return { fullName: '', phone: '', email: '', bankAccountNumber: '', bankName: '', accountHolderName: '', note: '' };
  }

  private autoConfirmMatchingPayment(orders: PaymentOrder[]): void {
    if (!this.result) return;

    const content = this.normalizePaymentText(this.result.extracted.content);
    const amount = Number(this.result.extracted.amount);
    if (!content || !Number.isFinite(amount)) return;

    const matchingOrder = orders.find((order) =>
      order.Status === 'PENDING'
      && !!order.PaymentCode
      && content.includes(this.normalizePaymentText(order.PaymentCode))
      && Math.abs(Number(order.Amount) - amount) < 0.01,
    );
    if (!matchingOrder) return;

    this.settlingOrderId = matchingOrder.PaymentOrderId;
    this.api.settlePaymentOrder(matchingOrder.PaymentOrderId, this.result.transaction.TransactionId).subscribe({
      next: (updated) => {
        const index = this.paymentOrders.findIndex((item) => item.PaymentOrderId === updated.PaymentOrderId);
        if (index >= 0) this.paymentOrders[index] = { ...this.paymentOrders[index], ...updated, Status: 'PAID' };
        this.paymentConfirmationMessage = `Đã tự động xác nhận thanh toán thành công cho đơn ${updated.PaymentCode}.`;
        this.settlingOrderId = null;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Không thể tự động xác nhận đơn thanh toán.';
        this.settlingOrderId = null;
      },
    });
  }

  private normalizePaymentText(value?: string | null): string {
    return (value || '').toLocaleLowerCase().replace(/\s+/g, '');
  }
}
