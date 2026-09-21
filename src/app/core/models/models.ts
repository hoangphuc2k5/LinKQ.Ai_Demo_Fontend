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

export interface OcrResponse {
  text: string;
  fileName: string | null;
}

export interface WarehouseSlipItem {
  stt: number;
  ma_so: string | null;
  ten_san_pham: string;
  dvt: string | null;
  sl: number;
  don_gia: number;
  thanh_tien: number;
  lo_lot: string | null;
  khuyen_mai: boolean;
}

export interface WarehouseSlip {
  warehouse_slip_id?: number;
  original_file_name?: string;
  created_at?: string;
  ky_hieu: string | null;
  ngay_lap: string | null;
  nha_cung_cap: {
    ten: string | null;
    logo_url?: string | null;
    ma_so_thue: string | null;
    so_tai_khoan: string | null;
    ngan_hang: string | null;
    dia_chi: string | null;
    hotline: string | null;
    fax?: string | null;
    dia_diem_kinh_doanh?: string | null;
    chi_nhanh?: string | null;
  };
  nhan_vien_ban_hang: { ten: string | null; sdt: string | null };
  so_po: string | null;
  ten_nguoi_lien_he?: string | null;
  khach_hang: { ten: string | null; dia_chi: string | null };
  dia_chi_giao_hang: { dia_chi: string | null; sdt: string | null };
  ghi_chu: string | null;
  trang?: string | null;
  thoi_gian_in?: string | null;
  chi_tiet_hang_hoa: WarehouseSlipItem[];
  tong_ket: {
    cong_tien_hang: number | null;
    chiet_khau: number | null;
    thue_suat_gtgt: string | null;
    tien_thue_gtgt: number | null;
    tong_tien_thanh_toan: number | null;
  };
  _meta?: { can_xac_nhan_thu_cong: boolean; canh_bao: string[] };
}
