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

    public class PaymentRequest
    {
        public PaymentRequest(
            Source source,
            int amount,
            string currency,
            string description = null,
            bool capture = true,
            ShippingDetails shipping = null,
            ThreeDSRequest threeDs = null
            )
        {
            Source = source;
            Amount = amount;
            Currency = currency;
            Description = description;
            Capture = capture;
            Shipping = shipping;
            ThreeDs = threeDs;
        }

        public Source Source { get; }
        public int Amount { get; }
        public string Currency { get; }
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
    }

    public class Source : IRequestSource
    {
        public Source(string type)
        {
            Type = type;
        }

        public string Type { get; }
        public string Token { get; set; }
        public string Id { get; set; }
        public string Number { get; set; }
        [JsonProperty(PropertyName = "expiry_month")]
        public int ExpiryMonth { get; set; }
        [JsonProperty(PropertyName = "expiry_year")]
        public int ExpiryYear { get; set; }
        public string Bic { get; set; }
        public string Purpose { get; set; }
        public string Description { get; set; }
        [JsonProperty(PropertyName = "customerName")]
        public string CustomerName { get; set; }
        public string Cpf { get; set; }
        [JsonProperty(PropertyName = "birthDate")]
        public string BirthDate { get; set; }
        [JsonProperty(PropertyName = "authorization_token")]
        public string AuthorizationToken { get; set; }
        public string Locale { get; set; }
        [JsonProperty(PropertyName = "purchase_country")]
        public string PurchaseCountry { get; set; }
        [JsonProperty(PropertyName = "tax_amount")]
        public int TaxAmount { get; set; }
        [JsonProperty(PropertyName = "billing_address")]
        public object BillingAddress { get; set; }
        public IEnumerable<KlarnaProduct> Products { get; set; }
        [JsonProperty(PropertyName = "payment_country")]
        public string PaymentCountry { get; set; }
        [JsonProperty(PropertyName = "account_holder_name")]
        public string AccountHolderName { get; set; }
        [JsonProperty(PropertyName = "billing_descriptor")]
        public string BillingDescriptor { get; set; }

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
                return BadRequest();
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
                return BadRequest();
            }
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
            var paymentRequest = new PaymentRequest<IRequestSource>(
                CreateRequestSource(request.Source),
                request.Currency,
                request.Amount
                )
            {
                Capture = request.Capture,
                ThreeDS = request.ThreeDs,
                Reference = $"cko_demo_{Guid.NewGuid()}",
                PaymentIp = "192.168.1.1",
                SuccessUrl = "http://localhost:59890/order/succeeded",
                FailureUrl = "http://localhost:59890/order/failed"
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
                HttpResponseMessage result = await client.PostAsJsonAsync(hypermediaRequest.Link, hypermediaRequest.Payload);
                string content = await result.Content.ReadAsStringAsync();
                return AcceptedAtRoute("Hypermedia", content);
            }
            catch (Exception e)
            {
                return BadRequest();
            }
        }

        public IRequestSource CreateRequestSource(Source source)
        {
            switch (source.Type)
            {
                case "token":
                    return new TokenSource(source.Token);
                case "id":
                    return new IdSource(source.Id);
                case "card":
                    return new CardSource(source.Number, source.ExpiryMonth, source.ExpiryYear);
                default:
                    return CreateAlternativePaymentSource(source);
            }
        }

        public IRequestSource CreateAlternativePaymentSource (Source source)
        {
            switch (source.Type)
            {
                case "bancontact":
                    return new AlternativePaymentSource(source.Type)
                    {
                        {"payment_country", source.PaymentCountry },
                        {"account_holder_name", source.AccountHolderName },
                        {"billing_descriptor", source.BillingDescriptor }
                    };
                case "boleto":
                    return new AlternativePaymentSource(source.Type)
                    {
                        {"customerName", source.CustomerName },
                        {"cpf", source.Cpf },
                        {"birthDate", source.BirthDate }
                    };
                case "eps":
                    return new AlternativePaymentSource(source.Type)
                    {
                        {"bic", source.Bic },
                        {"purpose", source.Purpose }
                    };
                case "giropay":
                    return new AlternativePaymentSource(source.Type)
                    {
                        {"bic", source.Bic },
                        {"purpose", source.Purpose }
                    };
                case "ideal":
                    return new AlternativePaymentSource(source.Type)
                    {
                        {"bic", source.Bic },
                        {"description", source.Description }
                    };
                case "klarna":
                    return new AlternativePaymentSource(source.Type)
                    {
                        {"authorization_token", source.AuthorizationToken },
                        {"locale", source.Locale },
                        {"purchase_country", source.PurchaseCountry },
                        {"tax_amount", source.TaxAmount.ToString() },
                        {"billing_address", source.BillingAddress },
                        {"products", source.Products }
                    };
                default:
                    return new AlternativePaymentSource(source.Type);
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
                return BadRequest();
            }
        }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class WebhooksController : Controller
    {
        [HttpPost("incoming/checkout")]
        [ProducesResponseType(200)]
        public IActionResult Webhooks(object sessionRequest)
        {
            return Ok();
        }
    }
}
