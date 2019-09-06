import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AppConfigService } from '../../services/app-config.service';
import { IWebPaymentDemoEnvironment } from '../../interfaces/web-payment-demo-environment.interface';

export interface Data {
  environment: string;
}

@Component({
  selector: 'app-environment-alert',
  templateUrl: './environment-alert.component.html',
})
export class EnvironmentAlertComponent {
  environment: string;
  webPaymentDemoEnvironments: IWebPaymentDemoEnvironment[] = this._appConfigService.webPaymentDemoEnvironments;

  constructor(
    public environmentAlertRef: MatDialogRef<EnvironmentAlertComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Data,
    private _appConfigService: AppConfigService
  ) {
    this.environment = data.environment;
  }

  switchEnvironment(webPaymentDemoEnvironment: IWebPaymentDemoEnvironment): void {
    this._appConfigService.switchEnvironment(webPaymentDemoEnvironment);
  }

  onConsentClick(): void {
    this.environmentAlertRef.close();
  }

  isAvailableEnvironment(webPaymentDemoEnvironment: IWebPaymentDemoEnvironment): boolean {
    return (!this._appConfigService.isCurrentEnvironment(webPaymentDemoEnvironment) && webPaymentDemoEnvironment.url != null);
  }

  getWebPaymentDemoEnvironment(): IWebPaymentDemoEnvironment {
    return this._appConfigService.webPaymentDemoEnvironments.find(webPaymentDemoEnvironment => webPaymentDemoEnvironment.name.toLowerCase() == this.environment.toLowerCase());
  }
}
