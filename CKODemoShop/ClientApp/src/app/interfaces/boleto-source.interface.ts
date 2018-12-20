import { ISource } from "./source.interface";

export interface IBoletoSource extends ISource {
  birthDate: string;
  cpf: string;
  customerName: string;
}
