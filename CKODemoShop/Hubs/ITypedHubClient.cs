using CKODemoShop.Controllers;
using System.Threading.Tasks;

namespace CKODemoShop.Hubs
{
    public interface IWebhooksHubClient
    {
        Task WebhookReceived(CheckoutWebhook checkoutWebhook);
        Task ConnectionIdMappedToGroup(string connectionId, string groupName);
    }
}
