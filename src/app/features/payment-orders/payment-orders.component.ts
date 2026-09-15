import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Customer, PaymentOrder } from '../../core/models/models';

@Component({
  selector: 'app-payment-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-orders.component.html',
  styleUrls: ['./payment-orders.component.css'],
})
export class PaymentOrdersComponent implements OnInit {
  customers: Customer[] = [];
  orders: PaymentOrder[] = [];
  selectedCustomerId: number | null = null;
  form = { customerId: null as number | null, paymentCode: '', amount: 0, currency: 'VND', description: '', dueDate: '' };
  isLoading = false;
  isSaving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getCustomers().subscribe({
      next: (customers) => (this.customers = customers),
      error: (err) => (this.errorMessage = err?.error?.error || 'Không thể tải khách hàng.'),
    });
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.api.getPaymentOrders(this.selectedCustomerId || undefined).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Không thể tải trạng thái đơn thanh toán.';
        this.isLoading = false;
      },
    });
  }

  selectCustomer(): void {
    this.selectedCustomerId = this.form.customerId;
    this.loadOrders();
  }

  create(): void {
    if (!this.form.customerId || !this.form.paymentCode.trim() || this.form.amount <= 0) {
      this.errorMessage = 'Vui lòng nhập mã thanh toán, chọn khách hàng và nhập số tiền hợp lệ.';
      return;
    }
    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.api.createPaymentOrder({ ...this.form, paymentCode: this.form.paymentCode.trim(), customerId: this.form.customerId }).subscribe({
      next: () => {
        this.successMessage = 'Đã tạo đơn thanh toán.';
        this.form = { customerId: this.form.customerId, paymentCode: '', amount: 0, currency: 'VND', description: '', dueDate: '' };
        this.selectedCustomerId = this.form.customerId;
        this.loadOrders();
        this.isSaving = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Không thể tạo đơn thanh toán.';
        this.isSaving = false;
      },
    });
  }

  changeStatus(order: PaymentOrder, status: string): void {
    this.api.updatePaymentOrderStatus(order.PaymentOrderId, status).subscribe({
      next: () => this.loadOrders(),
      error: (err) => (this.errorMessage = err?.error?.error || 'Không thể cập nhật trạng thái.'),
    });
  }

  customerName(customerId: number): string {
    return this.customers.find((customer) => customer.CustomerId === customerId)?.FullName || 'Khách hàng';
  }
}
