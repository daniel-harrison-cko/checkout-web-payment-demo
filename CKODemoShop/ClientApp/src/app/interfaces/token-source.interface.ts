import { ISource } from "./source.interface";

export interface ITokenSource extends ISource {
  token: string;
}
