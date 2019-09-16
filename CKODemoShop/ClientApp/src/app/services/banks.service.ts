import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { IBank } from '../interfaces/bank.interface';
import { FormGroup, FormBuilder, AbstractControl } from '@angular/forms';

const flatten = <T = any>(arr: T[]) => {
  const reducer = <T = any>(prev: T[], curr: T | T[]) => {
    if (curr.constructor !== Array) {
      return [...prev, curr];
    }
    return (<T[]>curr).reduce(reducer, prev);
  };
  return arr.reduce(reducer, []);
};

@Injectable({
  providedIn: 'root'
})
export class BanksService {
  private banksOfScheme: {} = {};
  private currentBanks: IBank[];
  private bankForm: FormGroup = this._formBuilder.group({
    bankSearchInput: null,
    filteredBanks: null,
    selectedBank: this._formBuilder.group({
      bic: null,
      name: null
    })
  });

  constructor(
    private _http: HttpClient,
    private _formBuilder: FormBuilder
  ) { }

  // Subjects
  private bankFormSource = new BehaviorSubject<FormGroup>(this.bankForm);

  // Observables
  public bankForm$ = this.bankFormSource.asObservable();

  // Methods
  public updateFilteredBanks(banksSearchInput: string) {
    this.filteredBanks.setValue(this.bankFilter(banksSearchInput));
    this.bankFormSource.next(this.bankForm);
  }

  get filteredBanks(): AbstractControl {
    return this.bankForm.get('filteredBanks');
  }

  public resetBanks() {
    this.bankForm.reset();
  }

  public getBanks = async (sourceType: string): Promise<any> => {
    if (!this.banksOfScheme[sourceType]) {
      let banksResponse;
      banksResponse = await this._getBanks(sourceType);
      let isLegacyStructure = (banksResponse.body._links.self.href as string).includes('eps') || (banksResponse.body._links.self.href as string).includes('giropay')
      let banks: IBank[] = [];
      switch (isLegacyStructure) {
        case true: {
          Object.keys(banksResponse.body.banks).forEach(function (key) {
            banks.push({
              bic: key,
              name: banksResponse.body.banks[key]
            })
          });
          this.banksOfScheme[sourceType] = banks;
          break;
        }
        case false: {
          banksResponse.body.countries.forEach(country => banks.push(country.issuers));
          this.banksOfScheme[sourceType] = <IBank[]>flatten(banks);
          break;
        }
      }
    }
    this.currentBanks = this.banksOfScheme[sourceType];
    this.filteredBanks.setValue(this.currentBanks);
    this.bankFormSource.next(this.bankForm);
    return await this.currentBanks;
  }

  private bankFilter(value: string): IBank[] {
    if (!value) {
      return this.currentBanks;
    } else {
      const filterValue = value.toString().toLowerCase();
      return this.currentBanks.filter(bank => { return `${bank.bic.toLowerCase()} ${bank.name.toLowerCase()}`.includes(filterValue) });
    }
  }

  // API Methods
  private _getBanks(sourceType: string): Promise<HttpResponse<any>> {
    return this._http.get<any>(`/api/checkout/${sourceType}/banks`, { observe: 'response' }).toPromise();
  }
}
