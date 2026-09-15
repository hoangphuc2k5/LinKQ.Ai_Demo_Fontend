import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AnalyzeResponse, Customer, CustomerInput, PaymentOrder } from '../../core/models/models';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
})
export class UploadComponent {
  selectedFile: File | null = null;
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.selectedFile = input.files[0];
    this.result = null;
    this.errorMessage = null;
    this.paymentConfirmationMessage = null;

    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(this.selectedFile);
  }

  analyze(): void {
    if (!this.selectedFile) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.result = null;

    this.api.analyzeImage(this.selectedFile).subscribe({
      next: (res) => {
        this.result = res;
        this.setMatchedCustomer(res.transaction.MatchedCustomerId);
        this.loadPaymentOrders(res.transaction.MatchedCustomerId);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Có lỗi xảy ra khi phân tích ảnh.';
        this.isLoading = false;
      },
    });
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
      note: 'Tạo từ kết quả phân tích ảnh giao dịch',
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
    this.selectedFile = null;
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
