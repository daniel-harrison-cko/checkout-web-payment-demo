import { ISource } from "./source.interface";

export interface IPaymentRequest {
  source: ISource;
  amount?: number;
  currency: string;
}
