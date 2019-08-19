using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Checkout;
using Checkout.Common;
using Checkout.Payments;
using System.Threading.Tasks;
using CKODemoShop.Checkout;
using System.Net.Http;
using Checkout.Tokens;
using Newtonsoft.Json;
using Checkout.Sources;
using System.Text.RegularExpressions;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using CKODemoShop.Hubs;
using Microsoft.Extensions.Primitives;

namespace CKODemoShop.Controllers
{
    public class IssuingBank
    {
        public string Bic { get; set; }
        public string Name { get; set; }
    }

    public class IssuingCountry
    {
        public string Name { get; set; }
        public List<IssuingBank> Issuers { get; set; } 
    }

    public class IssuersResponse : Resource
    {
        public List<IssuingCountry> Countries { get; set; }
    }

    public class BanksResponse : Resource
    {
        public Dictionary<string, string> Banks { get; set; }

        public bool HasBanks { get { return Banks.Count > 0; } }
    }

    public class CheckoutWebhook
    {
        public string Id { get; set; }
        public string Type { get; set; }
        [JsonProperty(PropertyName = "created_on")]
        public string CreatedOn { get; set; }
        public IDictionary<string, object> Data { get; set; }
    }

    public class WebhookRequest
    {
        private const string webhooksUrl = "/api/webhooks/incoming/checkout";

        public WebhookRequest(
            string baseUrl,
            string authorization,
            List<string> eventTypes
            )
        {
            //fallback for webhook configuration from localhost which gets rejected from Gateway as invalid URL: https://webhook.site/#!/8c914904-fe43-4f2b-b2fe-07cbc6962968
            Url = Regex.Match(baseUrl, @"^http[s]{0,1}:\/\/localhost.*$").Success ? $"https://webhook.site/8c914904-fe43-4f2b-b2fe-07cbc6962968" : $"{baseUrl}{webhooksUrl}";
            Headers.Add("Authorization", authorization);
            EventTypes = eventTypes;
        }

        public string Url { get; }
        public bool Active { get; } = true;
        public Dictionary<string, string> Headers { get; } = new Dictionary<string, string>();
        [JsonProperty(PropertyName = "content_type")]
        public string ContentType { get; } = "json";
        [JsonProperty(PropertyName = "event_types")]
        public List<string> EventTypes { get; }
    }

    public class PaymentRequest
    {
        public PaymentRequest(
            Source source,
            int amount,
            string currency,
            string reference = null,
            string description = null,
            bool capture = true,
            ShippingDetails shipping = null,
            ThreeDSRequest threeDs = null
            )
        {
            Source = source;
            Amount = amount;
            Currency = currency;
            Reference = reference;
            Description = description;
            Capture = capture;
            Shipping = shipping;
            ThreeDs = threeDs;
        }

        public Source Source { get; }
        public int Amount { get; }
        public string Currency { get; }
        public string Reference { get; }
        public string Description { get; set; }
        public bool Capture { get; set; }
        public ShippingDetails Shipping { get; set; }
        [JsonProperty(PropertyName = "3ds")]
        public ThreeDSRequest ThreeDs { get; set; }
    }

    public class HypermediaRequest
    {
        public string Link { get; set; }
        public object Payload { get; set; }
        public string HttpMethod { get; set; }
    }

    public class Source : Dictionary<string, object>, IRequestSource
    {
        public string Type { get; }
    }

    public class SessionRequest
    {
        [JsonProperty(PropertyName = "purchase_country")]
        public string PurchaseCountry { get; set; }
        public string Currency { get; set; }
        public string Locale { get; set; }
        public int Amount { get; set; }
        [JsonProperty(PropertyName = "tax_amount")]
        public int TaxAmount { get; set; }
        public IEnumerable<KlarnaProduct> Products { get; set; }
    }

    public class KlarnaProduct
    {
        [JsonProperty(PropertyName = "name")]
        public string Name { get; set; }
        [JsonProperty(PropertyName = "quantity")]
        public int Quantity { get; set; }
        [JsonProperty(PropertyName = "unit_price")]
        public int UnitPrice { get; set; }
        [JsonProperty(PropertyName = "tax_rate")]
        public int TaxRate { get; set; }
        [JsonProperty(PropertyName = "total_amount")]
        public int TotalAmount { get; set; }
        [JsonProperty(PropertyName = "total_tax_amount")]
        public int TotalTaxAmount { get; set; }
    }

    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class CheckoutController : Controller
    {
        private CheckoutApi api;
        private HttpClient client;

        public CheckoutController(CheckoutApi api, HttpClient client)
        {
            this.api = api ?? throw new ArgumentNullException(nameof(api));
            this.client = client ?? throw new ArgumentNullException(nameof(client));
        }

        [HttpGet("{lppId}/[action]", Name = "GetBanks")]
        [ActionName("Banks")]
        [ProducesResponseType(200, Type = typeof(IList<IIBank>))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetBanks(string lppId)
        {
            object response;
            try
            {
                if (lppId == "eps")
                {
                    client.DefaultRequestHeaders.Clear();
                    client.DefaultRequestHeaders.Add("Authorization", Environment.GetEnvironmentVariable("CKO_PUBLIC_KEY"));
                    HttpResponseMessage result = await client.GetAsync("https://api.sandbox.checkout.com/giropay/eps/banks");
                    string content = await result.Content.ReadAsStringAsync();
                    BanksResponse banksResponse = JsonConvert.DeserializeObject<BanksResponse>(content);
                    response = banksResponse;
                }
                else if (lppId == "giropay")
                {
                    client.DefaultRequestHeaders.Clear();
                    client.DefaultRequestHeaders.Add("Authorization", Environment.GetEnvironmentVariable("CKO_PUBLIC_KEY"));
                    HttpResponseMessage result = await client.GetAsync("https://api.sandbox.checkout.com/giropay/banks");
                    string content = await result.Content.ReadAsStringAsync();
                    BanksResponse banksResponse = JsonConvert.DeserializeObject<BanksResponse>(content);
                    response = banksResponse;
                }
                else if (lppId == "ideal")
                {
                    client.DefaultRequestHeaders.Clear();
                    client.DefaultRequestHeaders.Add("Authorization", Environment.GetEnvironmentVariable("CKO_PUBLIC_KEY"));
                    HttpResponseMessage result = await client.GetAsync("https://api.sandbox.checkout.com/ideal-external/issuers");
                    string content = await result.Content.ReadAsStringAsync();
                    IssuersResponse issuersResponse = JsonConvert.DeserializeObject<IssuersResponse>(content);
                    response = issuersResponse;
                }
                else
                {
                    throw new KeyNotFoundException();
                }
                return Ok(response);
            }
            catch(Exception e)
            {
                return NotFound(e.Message);
            }
        }

        [HttpPost("[action]/source/card", Name = "RequestCardToken")]
        [ActionName("Tokens")]
        [ProducesResponseType(201, Type = typeof(TokenResponse))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> RequestCardToken(CardTokenRequest tokenRequest)
        {
            try
            {
                var tokenResponse = await api.Tokens.RequestAsync(tokenRequest);
                return CreatedAtAction(nameof(RequestCardToken), tokenResponse);
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e.Message);
            }
        }

        [HttpPost("[action]/source/wallet", Name = "RequestWalletToken")]
        [ActionName("Tokens")]
        [ProducesResponseType(201, Type = typeof(TokenResponse))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> RequestWalletToken(WalletTokenRequest tokenRequest)
        {
            try
            {
                var tokenResponse = await api.Tokens.RequestAsync(tokenRequest);
                return CreatedAtAction(nameof(RequestWalletToken), tokenResponse);
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e.Message);
            }
        }

        [HttpGet("[action]/{paymentId}", Name = "GetPayment")]
        [ActionName("Payments")]
        [ProducesResponseType(200, Type = typeof(GetPaymentResponse))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetPayment(string paymentId)
        {
            try
            {
                GetPaymentResponse paymentResponse = await api.Payments.GetAsync(paymentId);
                return Ok(paymentResponse);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("payments/{paymentId}/[action]", Name = "GetActions")]
        [ActionName("Actions")]
        [ProducesResponseType(200, Type = typeof(IEnumerable<PaymentAction>))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetActions(string paymentId)
        {
            try
            {
                var actions = await api.Payments.GetActionsAsync(paymentId);
                return Ok(actions);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("[action]", Name = "GetEventTypes")]
        [ActionName("EventTypes")]
        [ProducesResponseType(200, Type = typeof(IEnumerable<object>))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetEventTypes()
        {
            client.DefaultRequestHeaders.Clear();
            try
            {
                client.DefaultRequestHeaders.Add("Authorization", Environment.GetEnvironmentVariable("CKO_SECRET_KEY"));
                HttpResponseMessage result = await client.GetAsync("https://api.sandbox.checkout.com/event-types");
                string content = await result.Content.ReadAsStringAsync();
                var response = JsonConvert.DeserializeObject(content);
                return Ok(response);
            }
            catch (Exception e)
            {
                return NotFound(e.Message);
            }
        }

        [HttpGet("[action]", Name = "GetWebhooks")]
        [ActionName("Webhooks")]
        [ProducesResponseType(200, Type = typeof(IEnumerable<object>))]
        [ProducesResponseType(204)]
        public async Task<IActionResult> GetWebhooks()
        {
            client.DefaultRequestHeaders.Clear();
            try
            {
                client.DefaultRequestHeaders.Add("Authorization", Environment.GetEnvironmentVariable("CKO_SECRET_KEY"));
                HttpResponseMessage result = await client.GetAsync("https://api.sandbox.checkout.com/webhooks");
                if(result.StatusCode == System.Net.HttpStatusCode.NoContent)
                {
                    return NoContent();
                }
                else
                {
                    string content = await result.Content.ReadAsStringAsync();
                    var response = JsonConvert.DeserializeObject(content);
                    return Ok(response);
                }
            }
            catch (Exception e)
            {
                return NotFound(e.Message);
            }
        }

        [HttpPost("[action]", Name = "AddWebhook")]
        [ActionName("Webhooks")]
        [ProducesResponseType(201, Type = typeof(object))]
        [ProducesResponseType(409)]
        [ProducesResponseType(422)]
        public async Task<IActionResult> AddWebhook([FromBody] List<string> eventTypes)
        {
            var baseUrl = $"https://{HttpContext.Request.Host}{HttpContext.Request.PathBase}";
            var webhookRequest = new WebhookRequest(baseUrl, "1234", eventTypes);

            client.DefaultRequestHeaders.Clear();
            try
            {
                client.DefaultRequestHeaders.Add("Authorization", Environment.GetEnvironmentVariable("CKO_SECRET_KEY"));
                HttpResponseMessage result = await client.PostAsJsonAsync("https://api.sandbox.checkout.com/webhooks", webhookRequest);
                string content = await result.Content.ReadAsStringAsync();
                object response = JsonConvert.DeserializeObject<object>(content);
                if (result.StatusCode == System.Net.HttpStatusCode.UnprocessableEntity)
                {
                    return UnprocessableEntity(response);
                }
                else if (result.StatusCode == System.Net.HttpStatusCode.Conflict)
                {
                    return Conflict();
                }
                else
                {
                    return CreatedAtAction(nameof(AddWebhook), response);
                }
            }
            catch (Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }

        [HttpDelete("[action]", Name = "ClearWebhooks")]
        [ActionName("Webhooks")]
        [ProducesResponseType(201, Type = typeof(object))]
        [ProducesResponseType(409)]
        [ProducesResponseType(422)]
        public async Task<IActionResult> ClearWebhooks()
        {
            List<Task> deletions = new List<Task>();
            async Task<IActionResult> deleteWebhook(string webhookId)
            {
                client.DefaultRequestHeaders.Clear();
                try
                {
                    client.DefaultRequestHeaders.Add("Authorization", Environment.GetEnvironmentVariable("CKO_SECRET_KEY"));
                    HttpResponseMessage result = await client.DeleteAsync($"https://api.sandbox.checkout.com/webhooks/{webhookId}");
                    if (result.IsSuccessStatusCode)
                    {
                        return Ok();
                    }
                    else
                    {
                        return NotFound();
                    }
                }
                catch (Exception e)
                {
                    return UnprocessableEntity(e.Message);
                }
            };
            var webhooks = await GetWebhooks();
            var serializedWebhooksResponse = JsonConvert.SerializeObject((webhooks as ObjectResult).Value);
            var deserializedWebhooksResponse = JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(serializedWebhooksResponse);
            var webhookIds = deserializedWebhooksResponse.Select(webhook => webhook["id"] as string).ToList();

            foreach(string webhookId in webhookIds)
            {
                deletions.Add(deleteWebhook(webhookId));
            }

            await Task.WhenAll(deletions);

            return Ok();
        }

        [HttpPost("[action]", Name = "RequestSource")]
        [ActionName("Sources")]
        [ProducesResponseType(201, Type = typeof(SourceResponse))]
        [ProducesResponseType(202, Type = typeof(SourceResponse))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> RequestSource(SourceRequest sourceRequest)
        {
            try
            {
                var sourceResponse = await api.Sources.RequestAsync(sourceRequest);
                if (sourceResponse.IsPending)
                {
                    throw new NotImplementedException("There is no use case for SourceResponse.Pending yet.");
                }
                else
                {
                    return CreatedAtAction(nameof(RequestSource), new { paymentId = sourceResponse.Source.Id }, sourceResponse.Source);
                }
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e.Message);
            }
        }

        [HttpPost("[action]", Name = "RequestPayment")]
        [ActionName("Payments")]
        [ProducesResponseType(201, Type = typeof(PaymentProcessed))]
        [ProducesResponseType(202, Type = typeof(PaymentPending))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> RequestPayment(PaymentRequest request)
        {
            string baseUrl;
            if(HttpContext.Request.Host.ToString().Contains("localhost"))
            {
                baseUrl = $"{HttpContext.Request.Scheme}://{HttpContext.Request.Host}{HttpContext.Request.PathBase}";
            }
            else
            {
                baseUrl = $"https://{HttpContext.Request.Host}{HttpContext.Request.PathBase}";
            }
            var paymentRequest = new PaymentRequest<IRequestSource>(
                request.Source,
                request.Currency,
                request.Amount
                )
            {
                Capture = request.Capture,
                ThreeDS = request.ThreeDs,
                Reference = request.Reference ?? $"cko_demo_{Guid.NewGuid()}",
                PaymentIp = HttpContext.Connection.RemoteIpAddress.ToString(),
                SuccessUrl = $"{baseUrl}/order/succeeded",
                FailureUrl = $"{baseUrl}/order/failed"
            };
            try
            {
                PaymentResponse paymentResponse = await api.Payments.RequestAsync(paymentRequest);
                if (paymentResponse.IsPending)
                {
                    return AcceptedAtAction(nameof(RequestPayment), new { paymentId = paymentResponse.Pending.Id }, paymentResponse.Pending);
                }
                else
                {
                    return CreatedAtAction(nameof(RequestPayment), new { paymentId = paymentResponse.Payment.Id }, paymentResponse.Payment);
                }
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e.Message);
            }
        }

        [HttpPost("[action]", Name = "RequestHypermedia")]
        [ActionName("Hypermedia")]
        [ProducesResponseType(202, Type = typeof(object))]
        [ProducesResponseType(400)]
        public async Task<IActionResult> RequestHypermedia(HypermediaRequest hypermediaRequest)
        {
            try
            {
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("Authorization", Environment.GetEnvironmentVariable("CKO_SECRET_KEY"));
                HttpResponseMessage result;
                switch (hypermediaRequest.HttpMethod)
                {
                    case "POST":
                        result = await client.PostAsJsonAsync(hypermediaRequest.Link, hypermediaRequest.Payload);
                        break;
                    case "PUT":
                        result = await client.PutAsJsonAsync(hypermediaRequest.Link, hypermediaRequest.Payload);
                        break;
                    default:
                        result = await client.PostAsJsonAsync(hypermediaRequest.Link, hypermediaRequest.Payload);
                        break;
                }
                if (!result.IsSuccessStatusCode) throw new Exception(result.ReasonPhrase);
                string content = await result.Content.ReadAsStringAsync();
                return AcceptedAtAction(nameof(RequestHypermedia), JsonConvert.DeserializeObject(content));
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class KlarnaController : Controller
    {
        private HttpClient client;

        public KlarnaController(HttpClient client)
        {
            this.client = client ?? throw new ArgumentNullException(nameof(client));
        }

        [HttpPost("[action]", Name = "RequestCreditSession")]
        [ActionName("CreditSessions")]
        [ProducesResponseType(201, Type = typeof(GetPaymentResponse))]
        [ProducesResponseType(400)]
        public async Task<IActionResult> RequestCreditSession(SessionRequest sessionRequest)
        {
            try
            {
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("Authorization", Environment.GetEnvironmentVariable("CKO_PUBLIC_KEY"));
                HttpResponseMessage result = await client.PostAsJsonAsync("https://sbapi.ckotech.co/klarna-external/credit-sessions", sessionRequest);
                string content = await result.Content.ReadAsStringAsync();
                return CreatedAtAction(nameof(RequestCreditSession), content);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class WebhooksController : Controller
    {
        private const string AUTHORIZATION_TOKEN = "1234";
        private IHubContext<WebhooksHub, ITypedHubClient> hubContext;
        private StringValues authorizationToken;

        public WebhooksController(IHubContext<WebhooksHub, ITypedHubClient> hubContext)
        {
            this.hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
        }

        [HttpPost("incoming/checkout", Name = "HandleCheckoutWebhook")]
        [ActionName("Webhooks")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> HandleCheckoutWebhook(CheckoutWebhook webhook)
        {
            try
            {
                if (!HttpContext.Request.Headers.TryGetValue("authorization", out authorizationToken)) throw new UnauthorizedAccessException("No Authorization HEADER found.");
                if (authorizationToken != AUTHORIZATION_TOKEN) throw new UnauthorizedAccessException("Incorrect Authorization HEADER.");
            }
            catch(Exception e)
            {
                return Unauthorized(e.Message);
            }
            Console.WriteLine($"[{webhook.CreatedOn} WEBHOOK] {webhook.Data["id"]} ({webhook.Type})\n");
            try
            {
                await hubContext.Clients.All.WebhookReceived(webhook);
                return Ok();
            }
            catch(Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class ShopController : Controller
    {
        [HttpGet("[action]", Name = "GetReference")]
        [ActionName("References")]
        [ProducesResponseType(201, Type = typeof(string))]
        public IActionResult GetReference()
        {
            try
            {
                return CreatedAtAction(nameof(GetReference), new Dictionary<string, string>() { {"reference", $"cko_demo_{Guid.NewGuid()}" } });
            }
            catch (Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }
    }
}
