using CKODemoShop.Controllers;
using System.Threading.Tasks;

namespace CKODemoShop.Hubs
{
    public interface IWebhooksHubClient
    {
        Task WebhookReceived(CheckoutWebhook checkoutWebhook);
        Task ConnectionMappedToPayment(string connectionId, string paymentId);
    }
}
