using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace CKODemoShop.Hubs
{
    public class WebhooksHub : Hub<IWebhooksHubClient> {

        // overrides base method of new incoming connection to Websocket HUB
        public override async Task OnConnectedAsync()
        {
            var publicKey = Environment.GetEnvironmentVariable("CKO_PUBLIC_KEY");
            Console.WriteLine($"Mapped Websocket Connection {Context.ConnectionId} to {publicKey}");
            // adds the incoming connection id to a common group
            await Groups.AddToGroupAsync(Context.ConnectionId, publicKey);
            // gives feedback to the client about mapping
            await Clients.Caller.ConnectionIdMappedToGroup(Context.ConnectionId, publicKey);
            await base.OnConnectedAsync();
        }
    }
}
