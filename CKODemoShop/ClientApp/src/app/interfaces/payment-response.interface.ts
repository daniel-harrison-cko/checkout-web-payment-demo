import { IPending } from "./pending.interface";
import { IPayment } from "./payment.interface";

export interface IPaymentResponse {
  isPending: boolean;
  payment?: IPayment;
  pending?: IPending;
}
