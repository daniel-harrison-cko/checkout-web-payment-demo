import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import * as signalR from "@aspnet/signalr";

const connection = new signalR.HubConnectionBuilder()
  .withUrl('/api/webhooks/hub')
  .build();
connection.start().catch(e => console.error(e));

@Injectable({
  providedIn: 'root'
})
export class WebsocketsService {

  constructor() {
    connection.on("webhookReceived", webhook => this.receivedWebhook(webhook));
  }

  // Subjects
  private webhooksHubSource = new Subject<any>();

  // Observables
  public webhooksHub$ = this.webhooksHubSource.asObservable();

  // Methods
  private receivedWebhook(webhook: any) {
    this.webhooksHubSource.next(webhook);
  }
}
