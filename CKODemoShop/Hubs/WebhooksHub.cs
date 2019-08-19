using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace CKODemoShop.Hubs
{
    public class WebhooksHub : Hub<IWebhooksHubClient> {

        public override async Task OnConnectedAsync()
        {
            var publicKey = Environment.GetEnvironmentVariable("CKO_PUBLIC_KEY");
            Console.WriteLine($"Mapped Websocket Connection {Context.ConnectionId} to {publicKey}");
            await Groups.AddToGroupAsync(Context.ConnectionId, publicKey);
            await Clients.Caller.ConnectionIdMappedToGroup(Context.ConnectionId, publicKey);
            await base.OnConnectedAsync();
        }
    }
}
