import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalyzeResponse, Customer, CustomerInput, PaymentOrder, Transaction } from '../models/models';

const API_BASE = 'https://africa-easy-galaxy-non.trycloudflare.com/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // ---- Transactions ----
  analyzeImage(file: File): Observable<AnalyzeResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<AnalyzeResponse>(`${API_BASE}/transactions/analyze`, formData);
  }

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${API_BASE}/transactions`);
  }

  confirmTransactionCustomer(transactionId: number, customerId: number): Observable<Transaction> {
    return this.http.put<Transaction>(`${API_BASE}/transactions/${transactionId}/confirm`, {
      customerId,
    });
  }

  // ---- Customers ----
  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${API_BASE}/customers`);
  }

  createCustomer(customer: CustomerInput): Observable<Customer> {
    return this.http.post<Customer>(`${API_BASE}/customers`, customer);
  }

  updateCustomer(id: number, customer: CustomerInput): Observable<Customer> {
    return this.http.put<Customer>(`${API_BASE}/customers/${id}`, customer);
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/customers/${id}`);
  }

  // ---- Payment orders ----
  getPaymentOrders(customerId?: number): Observable<PaymentOrder[]> {
    const url = customerId
      ? `${API_BASE}/payment-orders?customerId=${customerId}`
      : `${API_BASE}/payment-orders`;
    return this.http.get<PaymentOrder[]>(url);
  }

  createPaymentOrder(input: {
    customerId: number;
    paymentCode: string;
    amount: number;
    currency: string;
    description?: string;
    dueDate?: string;
  }): Observable<PaymentOrder> {
    return this.http.post<PaymentOrder>(`${API_BASE}/payment-orders`, input);
  }

  updatePaymentOrderStatus(id: number, status: string): Observable<PaymentOrder> {
    return this.http.patch<PaymentOrder>(`${API_BASE}/payment-orders/${id}/status`, { status });
  }

  settlePaymentOrder(orderId: number, transactionId: number): Observable<PaymentOrder> {
    return this.http.post<PaymentOrder>(`${API_BASE}/payment-orders/${orderId}/settle`, { transactionId });
  }
}
