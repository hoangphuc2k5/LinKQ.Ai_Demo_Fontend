export interface Customer {
  CustomerId: number;
  FullName: string;
  Phone?: string;
  Email?: string;
  BankAccountNumber?: string;
  BankName?: string;
  AccountHolderName?: string;
  Note?: string;
  CreatedAt?: string;
}

export interface CustomerInput {
  fullName: string;
  phone?: string;
  email?: string;
  bankAccountNumber?: string;
  bankName?: string;
  accountHolderName?: string;
  note?: string;
}

export type PaymentOrderStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';

export interface PaymentOrder {
  PaymentOrderId: number;
  CustomerId: number;
  PaymentCode: string;
  FullName?: string;
  BankAccountNumber?: string;
  Amount: number;
  Currency: string;
  Description?: string;
  DueDate?: string;
  Status: PaymentOrderStatus;
  PaidTransactionCode?: string;
  CreatedAt?: string;
}

export interface ExtractedPaymentInfo {
  bankName: string | null;
  senderBankName: string | null;
  receiverBankName: string | null;
  senderAccountNumber: string | null;
  senderAccountName: string | null;
  receiverAccountNumber: string | null;
  receiverAccountName: string | null;
  amount: number | null;
  currency: string | null;
  transactionCode: string | null;
  transactionDate: string | null;
  content: string | null;
  confidence: number;
}

export interface MatchCandidate {
  customer: Customer;
  confidence: number;
}

export interface Transaction {
  TransactionId: number;
  ImageUrl?: string;
  OriginalFileName?: string;
  BankName?: string;
  SenderAccountNumber?: string;
  SenderAccountName?: string;
  ReceiverAccountNumber?: string;
  ReceiverAccountName?: string;
  Amount?: number;
  Currency?: string;
  TransactionCode?: string;
  TransactionDate?: string;
  Content?: string;
  MatchedCustomerId?: number;
  MatchedCustomerName?: string;
  MatchConfidence?: number;
  MatchStatus: 'PENDING' | 'MATCHED' | 'UNMATCHED' | 'NEEDS_REVIEW';
  Status: 'NEW' | 'CONFIRMED' | 'REJECTED';
  CreatedAt?: string;
}

export interface AnalyzeResponse {
  transaction: Transaction;
  extracted: ExtractedPaymentInfo;
  matchCandidates: MatchCandidate[];
}
