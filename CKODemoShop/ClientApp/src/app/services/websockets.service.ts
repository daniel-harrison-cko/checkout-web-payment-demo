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
    connection.on("connectionIdMappedToGroup", (connectionId, groupName) => console.log(`Mapped Websocket Connection ${connectionId} to ${groupName}.`));
  }

  // Subjects
  private webhooksHubSource = new Subject<any>();

  // Observables
  public webhooksHub$ = this.webhooksHubSource.asObservable();

  // Methods
  private receivedWebhook(webhook: any) {
    this.webhooksHubSource.next(webhook);
  }

  public startConnection(): void {
    connection.start().catch(error => console.error(error));
  }

  public stopConnection(): void {
    connection.stop().catch(error => console.error(error));
  }
}
