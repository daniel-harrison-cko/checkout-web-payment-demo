import { ILink } from "./link.interface";

export interface ILinks {
  self: ILink;
  actions?: ILink;
  redirect?: ILink;
  void?: ILink;
  capture?: ILink;
  refund?: ILink;
  'response-code'?: ILink;
}
