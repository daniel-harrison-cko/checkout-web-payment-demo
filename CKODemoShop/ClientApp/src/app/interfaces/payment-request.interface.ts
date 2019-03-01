import { ISource } from "./source.interface";

export interface IPaymentRequest {
  source: ISource;
  amount?: number;
  currency: string;
  payment_type?: object;
  reference?: string;
  description?: string;
  capture?: boolean;
  capture_on?: string;
  customer?: object;
  billing_descriptor?: object;
  shipping?: object;
  '3ds'?: object;
  previous_payment_id?: string;
  risk?: object;
  success_url?: string;
  failure_url?: string;
  payment_ip?: string;
  recipient?: object;
  metadata?: object;
}
