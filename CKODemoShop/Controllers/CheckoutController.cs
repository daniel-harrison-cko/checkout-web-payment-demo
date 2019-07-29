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

    public class Webhook
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
            Url = Regex.Match(baseUrl, @"^http[s]{0,1}:\/\/localhost.*$").Success ? $"https://55bf5c0f.ngrok.io/demoshop-external{webhooksUrl}" : $"{baseUrl}{webhooksUrl}";
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
        [JsonProperty(PropertyName = "httpMethod")]
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

        [HttpGet("{lppId}/[action]")]
        [ProducesResponseType(200, Type = typeof(IList<IIBank>))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Banks(string lppId)
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
                return NotFound(e);
            }
        }

        [HttpPost("[action]/source/card")]
        [ProducesResponseType(201, Type = typeof(TokenResponse))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> Tokens(CardTokenRequest tokenRequest)
        {
            try
            {
                var tokenResponse = await api.Tokens.RequestAsync(tokenRequest);
                return CreatedAtAction(nameof(Tokens), tokenResponse);
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e);
            }
        }

        [HttpPost("[action]/source/wallet")]
        [ProducesResponseType(201, Type = typeof(TokenResponse))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> Tokens(WalletTokenRequest tokenRequest)
        {
            try
            {
                var tokenResponse = await api.Tokens.RequestAsync(tokenRequest);
                return CreatedAtAction(nameof(Tokens), tokenResponse);
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e);
            }
        }

        [HttpGet("[action]/{paymentId}", Name = "GetPayment")]
        [ProducesResponseType(200, Type = typeof(GetPaymentResponse))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Payments(string paymentId)
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

        [HttpGet("payments/{paymentId}/[action]", Name = "GetPaymentActions")]
        [ProducesResponseType(200, Type = typeof(IEnumerable<PaymentAction>))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Actions(string paymentId)
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
        [ProducesResponseType(200, Type = typeof(IEnumerable<object>))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> EventTypes()
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
                return NotFound(e);
            }
        }

        [HttpGet("[action]", Name = "GetWebhooks")]
        [ProducesResponseType(200, Type = typeof(IEnumerable<object>))]
        [ProducesResponseType(204)]
        public async Task<IActionResult> Webhooks()
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
                return NotFound(e);
            }
        }

        [HttpPost("[action]", Name = "AddWebhook")]
        [ProducesResponseType(201, Type = typeof(object))]
        [ProducesResponseType(409)]
        [ProducesResponseType(422)]
        public async Task<IActionResult> Webhooks([FromBody] List<string> eventTypes)
        {
            var baseUrl = $"{HttpContext.Request.Scheme}://{HttpContext.Request.Host}{HttpContext.Request.PathBase}";
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
                    return CreatedAtRoute("AddWebhook", response);
                }
            }
            catch (Exception e)
            {
                return StatusCode(500);
            }
        }

        [HttpDelete("[action]", Name = "ClearWebhooks")]
        [ProducesResponseType(201, Type = typeof(object))]
        [ProducesResponseType(409)]
        [ProducesResponseType(422)]
        public async Task<IActionResult> Webhooks(string test = null)
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
                    return UnprocessableEntity(e);
                }
            };
            var webhooks = await Webhooks();
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

        [HttpPost("[action]")]
        [ProducesResponseType(201, Type = typeof(SourceResponse))]
        [ProducesResponseType(202, Type = typeof(SourceResponse))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> Sources(SourceRequest sourceRequest)
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
                    return CreatedAtAction("RequestSource", new { paymentId = sourceResponse.Source.Id }, sourceResponse.Source);
                }
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e);
            }
        }

        [HttpPost("[action]", Name = "PostPayment")]
        [ProducesResponseType(201, Type = typeof(PaymentProcessed))]
        [ProducesResponseType(202, Type = typeof(PaymentPending))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> Payments(PaymentRequest request)
        {
            var baseUrl = $"{HttpContext.Request.Scheme}://{HttpContext.Request.Host}{HttpContext.Request.PathBase}";
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
                    return AcceptedAtRoute("PostPayment", new { paymentId = paymentResponse.Pending.Id }, paymentResponse.Pending);
                }
                else
                {
                    return CreatedAtRoute("PostPayment", new { paymentId = paymentResponse.Payment.Id }, paymentResponse.Payment);
                }
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e);
            }
        }

        [HttpPost("[action]", Name = "Hypermedia")]
        [ProducesResponseType(202, Type = typeof(GetPaymentResponse))]
        [ProducesResponseType(400)]
        public async Task<IActionResult> Hypermedia(HypermediaRequest hypermediaRequest)
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
                return AcceptedAtRoute("Hypermedia", content);
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
        private CheckoutApi api;
        private HttpClient client;

        public KlarnaController(CheckoutApi api, HttpClient client)
        {
            this.api = api ?? throw new ArgumentNullException(nameof(api));
            this.client = client ?? throw new ArgumentNullException(nameof(client));
        }

        [HttpPost("[action]", Name = "CreditSessions")]
        [ProducesResponseType(201, Type = typeof(GetPaymentResponse))]
        [ProducesResponseType(400)]
        public async Task<IActionResult> CreditSessions(SessionRequest sessionRequest)
        {
            try
            {
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("Authorization", Environment.GetEnvironmentVariable("CKO_PUBLIC_KEY"));
                HttpResponseMessage result = await client.PostAsJsonAsync("https://sbapi.ckotech.co/klarna-external/credit-sessions", sessionRequest);
                string content = await result.Content.ReadAsStringAsync();
                return CreatedAtAction("CreditSessions", content);
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
        [HttpPost("incoming/checkout")]
        [ProducesResponseType(200)]
        public IActionResult Webhooks(Webhook webhook)
        {
            Console.WriteLine($"\nWEBHOOK\n{webhook.CreatedOn} - {webhook.Data["id"]} ({webhook.Type})\n");
            return Ok();
        }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class ShopController : Controller
    {
        [HttpGet("[action]")]
        [ProducesResponseType(201, Type = typeof(string))]
        public IActionResult Reference()
        {
            try
            {
                return CreatedAtAction(nameof(Reference), new Dictionary<string, string>() { {"reference", $"cko_demo_{Guid.NewGuid()}" } });
            }
            catch (Exception e)
            {
                return StatusCode(500, e);
            }
        }
    }
}
