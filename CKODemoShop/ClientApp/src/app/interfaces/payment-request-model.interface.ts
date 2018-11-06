import { ISource } from "./source.interface";

export interface IPaymentRequestModel {
  source: ISource;
  amount?: number;
  currency: string;
}
