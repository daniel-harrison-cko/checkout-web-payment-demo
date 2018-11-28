import { IAddress } from "./address.interface";

export interface ISource {
  type: string;
  id?: string;
  billingAddress?: IAddress;
  phone?: object;
  expiryMonth?: number;
  expiryYear?: number;
  name?: string;
  scheme?: string;
  last4?: string;
  fingerprint?: string;
  bin?: string;
  cardType?: number;
  cardCategory?: number;
  issuer?: string;
  issuerCountry?: string;
  productId?: string;
  productType?: string;
  avsCheck?: string;
  cvvCheck?: string;
  number?: string;
}
