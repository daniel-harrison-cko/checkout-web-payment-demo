import { ILinks } from "./links.interface";

export interface IBanks extends Map<string, string> {
  banks: {}[];
  hasBanks: boolean;
  _links?: ILinks;
}
