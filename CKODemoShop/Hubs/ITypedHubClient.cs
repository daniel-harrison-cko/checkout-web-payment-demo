using CKODemoShop.Checkout;
using System.Threading.Tasks;

namespace CKODemoShop.Hubs
{
    public interface IWebhooksHubClient
    {
        Task WebhookReceived(Webhook checkoutWebhook);
        Task ConnectionMappedToPayment(string connectionId, string paymentId);
    }
}
