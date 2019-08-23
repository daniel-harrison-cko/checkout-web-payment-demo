import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import * as signalR from "@aspnet/signalr";

const connection = new signalR.HubConnectionBuilder()
  .withUrl('/api/webhooks/hub')
  .build();

@Injectable({
  providedIn: 'root'
})
export class WebsocketsService {

  constructor() {
    connection.on("webhookReceived", webhook => this.receivedWebhook(webhook));
    connection.on("connectionMappedToPayment", (connectionId, paymentId) => console.log(`Mapped Websocket Connection ${connectionId} to ${paymentId}.`));
  }

  // Subjects
  private webhooksHubSource = new Subject<any>();

  // Observables
  public webhooksHub$ = this.webhooksHubSource.asObservable();

  // Methods
  private receivedWebhook(webhook: any) {
    this.webhooksHubSource.next(webhook);
  }

  public startConnection(paymentId: string = null): void {
    connection.start().then(() => connection.invoke("mapConnectionToPayment", paymentId)).catch(error => console.error(error));
  }

  public stopConnection(): void {
    connection.stop().catch(error => console.error(error));
  }
}
