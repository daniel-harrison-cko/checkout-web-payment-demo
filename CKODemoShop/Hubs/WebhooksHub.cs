using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace CKODemoShop.Hubs
{
    public class WebhooksHub : Hub<IWebhooksHubClient> {

        public async Task MapConnectionToPayment(string paymentId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, paymentId);
            Console.WriteLine($"Mapped Websocket Connection {Context.ConnectionId} to {paymentId}");
            await Clients.Caller.ConnectionMappedToPayment(Context.ConnectionId, paymentId);
        }
    }
}
