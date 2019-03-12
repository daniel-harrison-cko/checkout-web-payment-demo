import { ISource } from "./source.interface";

export interface IIdealSource extends ISource {
  bic: string;
  description: string;
}
