import { ISource } from "./source.interface";

export interface IGiropaySource extends ISource {
  purpose: string;
  bic: string;
  iban?: string;
  info_fields?: object[];
}
