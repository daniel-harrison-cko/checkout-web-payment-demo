import { IAddress } from "./address.interface";

export interface IUser {
  createdOn: number;
  id: string;
  email: string;
  name: string;
  addresses: IAddress[];
  billingAddress: IAddress;
  shippingAddress: IAddress;
}
