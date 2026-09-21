import { Routes } from '@angular/router';
import { UploadComponent } from './features/upload/upload.component';
import { TransactionsComponent } from './features/transactions/transactions.component';
import { CustomersComponent } from './features/customers/customers.component';
import { PaymentOrdersComponent } from './features/payment-orders/payment-orders.component';
import { WarehouseSlipsComponent } from './features/warehouse-slips/warehouse-slips.component';
import { WarehouseUploadComponent } from './features/warehouse-upload/warehouse-upload.component';
import { OcrComponent } from './features/ocr/ocr.component';

export const routes: Routes = [
  { path: '', redirectTo: 'upload', pathMatch: 'full' },
  { path: 'upload', component: UploadComponent },
  { path: 'ocr', component: OcrComponent },
  { path: 'warehouse-slips', component: WarehouseUploadComponent },
  { path: 'warehouse-slips/list', component: WarehouseSlipsComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'customers', component: CustomersComponent },
  { path: 'payment-orders', component: PaymentOrdersComponent },
];
