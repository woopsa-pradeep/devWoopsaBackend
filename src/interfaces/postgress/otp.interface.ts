// interfaces/otp.interface.ts
export interface IOtp {
  id?: number;
  email: string;
  otp: string;
  expiresAt: Date;
  customerId?: string | null;
  adminId?: string | null;
  role?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
