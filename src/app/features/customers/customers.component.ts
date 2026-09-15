import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Customer, CustomerInput } from '../../core/models/models';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css'],
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  isLoading = false;
  isSaving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  editingId: number | null = null;
  form: CustomerInput = this.emptyForm();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.api.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Không thể tải danh sách khách hàng.';
        this.isLoading = false;
      },
    });
  }

  save(): void {
    if (!this.form.fullName?.trim()) {
      this.errorMessage = 'Vui lòng nhập họ tên khách hàng.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;
    const request = this.editingId === null
      ? this.api.createCustomer(this.form)
      : this.api.updateCustomer(this.editingId, this.form);

    request.subscribe({
      next: () => {
        this.successMessage = this.editingId === null ? 'Đã thêm khách hàng.' : 'Đã cập nhật khách hàng.';
        this.cancelEdit();
        this.load();
        this.isSaving = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Không thể lưu khách hàng.';
        this.isSaving = false;
      },
    });
  }

  edit(customer: Customer): void {
    this.editingId = customer.CustomerId;
    this.form = {
      fullName: customer.FullName || '',
      phone: customer.Phone || '',
      email: customer.Email || '',
      bankAccountNumber: customer.BankAccountNumber || '',
      bankName: customer.BankName || '',
      accountHolderName: customer.AccountHolderName || '',
      note: customer.Note || '',
    };
    this.errorMessage = null;
    this.successMessage = null;
  }

  remove(customer: Customer): void {
    if (!confirm(`Xóa khách hàng ${customer.FullName}?`)) return;

    this.api.deleteCustomer(customer.CustomerId).subscribe({
      next: () => {
        this.successMessage = 'Đã xóa khách hàng.';
        this.load();
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Không thể xóa khách hàng.';
      },
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form = this.emptyForm();
  }

  private emptyForm(): CustomerInput {
    return {
      fullName: '',
      phone: '',
      email: '',
      bankAccountNumber: '',
      bankName: '',
      accountHolderName: '',
      note: '',
    };
  }
}
