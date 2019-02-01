import { ILinks } from "./links.interface";
import { ICustomer } from "./customer.interface";
import { ISource } from "./source.interface";

export interface IPayment {
  id: string;
  requested_on?: string;
  source: ISource;
  amount: number;
  currency: string;
  payment_type?: string;
  reference?: string;
  description?: string;
  approved?: boolean;
  status: string;
  '3ds'?: object;
  risk?: object;
  customer: ICustomer;
  billing_descriptor?: object;
  shipping?: object;
  payment_ip?: string;
  recipient?: object;
  metadata?: any;
  eci?: string;
  requires_redirect?: boolean;
  action_id?: string;
  auth_code?: string;
  response_code?: string;
  response_summary?: string;
  processed_on: string;
  scheme_id?: string;
  _links: ILinks;
  actions?: Object[];
}
