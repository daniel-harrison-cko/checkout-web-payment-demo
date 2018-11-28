import { ILinks } from "./links.interface";
import { ICustomer } from "./customer.interface";
import { ISource } from "./source.interface";

export interface IPayment {
  id: string;
  action_id?: string;
  amount: number;
  currency: string;
  approved?: boolean;
  status: number;
  auth_code?: string;
  response_code?: string;
  response_summary?: string;
  '3ds'?: object;
  risk?: object;
  source: ISource;
  customer: ICustomer;
  processed_on: string;
  requestedOn?: string;
  reference?: string;
  eci?: string;
  scheme_id?: string;
  _links: ILinks;
}
