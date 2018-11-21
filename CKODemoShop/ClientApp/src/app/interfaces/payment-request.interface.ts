import { ISource } from "./source.interface";

export interface IPaymentRequest {
  paymentIp?: string;
  failureUrl?: string;
  successUrl?: string;
  Risk?: object;
  previousPaymentId?: string;
  threeDs?: object;
  shipping?: object;
  billingDescriptor?: object;
  customer?: object;
  captureOn?: object;
  capture?: boolean;
  description?: string;
  reference?: string;
  paymentType?: object;
  recipient?: object;
  metadata?: object;

  currency: string;
  amount?: number;
  source: ISource;
}
