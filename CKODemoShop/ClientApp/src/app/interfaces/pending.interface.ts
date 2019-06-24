import { ILinks } from "./links.interface";

export interface IPending {
  id: string;
  status: number;
  reference?: string;
  customer: object;
  '3ds'?: object;
  _links?: ILinks;
}
