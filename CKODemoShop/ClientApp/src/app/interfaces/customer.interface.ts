import { IAddress } from "./address.interface";

export interface ICustomer {
  createdOn: number;
  name: string;
  id: string;
  email: string;
  addresses: IAddress[];
  billingAddress: IAddress;
  shippingAddress: IAddress;
}
