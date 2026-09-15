import { Routes } from '@angular/router';
import { UploadComponent } from './features/upload/upload.component';
import { TransactionsComponent } from './features/transactions/transactions.component';
import { CustomersComponent } from './features/customers/customers.component';
import { PaymentOrdersComponent } from './features/payment-orders/payment-orders.component';

export const routes: Routes = [
  { path: '', redirectTo: 'upload', pathMatch: 'full' },
  { path: 'upload', component: UploadComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'customers', component: CustomersComponent },
  { path: 'payment-orders', component: PaymentOrdersComponent },
];
