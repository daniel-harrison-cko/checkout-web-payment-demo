using CKODemoShop.Controllers;
using System.Threading.Tasks;

namespace CKODemoShop.Hubs
{
    public interface ITypedHubClient
    {
        Task WebhookReceived(CheckoutWebhook checkoutWebhook);
    }
}
