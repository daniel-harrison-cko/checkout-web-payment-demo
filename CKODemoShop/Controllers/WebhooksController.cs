using System;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using CKODemoShop.Checkout;
using Microsoft.AspNetCore.SignalR;
using CKODemoShop.Hubs;
using Microsoft.Extensions.Primitives;

namespace CKODemoShop.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WebhooksController : Controller
    {
        private const string WEBHOOK_AUTH_TOKEN = "384021d9-c1ac-4ead-b0d2-b8a8430f409b";
        private IHubContext<WebhooksHub, IWebhooksHubClient> hubContext;
        private StringValues authorizationToken;
        private string paymentId;

        public WebhooksController(IHubContext<WebhooksHub, IWebhooksHubClient> hubContext)
        {
            this.hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
        }

        [HttpPost("incoming/checkout", Name = "HandleCheckoutWebhook")]
        [ActionName("Webhooks")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> HandleCheckoutWebhook(Webhook webhook)
        {
            try
            {
                if (!HttpContext.Request.Headers.TryGetValue("authorization", out authorizationToken)) throw new UnauthorizedAccessException("No Authorization HEADER found.");
                if (authorizationToken != WEBHOOK_AUTH_TOKEN) throw new UnauthorizedAccessException("Incorrect Authorization HEADER.");
            }
            catch(Exception e)
            {
                return Unauthorized(e.Message);
            }
            try
            {
                object outPaymentId;
                if (!webhook.Data.ContainsKey("id")) throw new ArgumentNullException("The webhook is missing the data.id field");
                if (!webhook.Data.TryGetValue("id", out outPaymentId)) throw new ArgumentNullException("The data.id field does not contain a string");
                paymentId = (string)outPaymentId;
                if (paymentId == null) throw new ArgumentNullException("The data.id field must not be null");
            }
            catch(Exception e)
            {
                return UnprocessableEntity(e.Message);
            }
            Console.WriteLine($"[{webhook.CreatedOn} WEBHOOK] {paymentId} ({webhook.Type})\n");
            try
            {
                // broadcasts "WebhookReceived" event to all connections in the group
                await hubContext.Clients.Group(paymentId).WebhookReceived(webhook);
                return Ok();
            }
            catch(Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }
    }
}
