import { ISource } from "./source.interface";

export interface IBoletoSource extends ISource {
  birth_date: string;
  cpf: string;
  customer_name: string;
}
