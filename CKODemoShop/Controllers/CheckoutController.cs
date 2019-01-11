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
    public class BanksResponse : Resource
    {
        public Dictionary<string,string> Banks { get; set; }

        public bool HasBanks { get { return Banks.Count > 0; } }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class CheckoutController : Controller
    {
        static CheckoutApi api = CheckoutApi.Create(
            secretKey: Environment.GetEnvironmentVariable("CKO_SECRET_KEY"),
            publicKey: Environment.GetEnvironmentVariable("CKO_PUBLIC_KEY"),
            useSandbox: true
            );
        static HttpClient client = new HttpClient();

        [HttpGet("{lppId}/[action]")]
        [ProducesResponseType(200, Type = typeof(IList<IIBank>))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Banks(string lppId)
        {
            object response = null;
            IList<IIBank> legacyBanks;
            IDictionary<string, string> banks;
            try
            {
                if (lppId == "lpp_9")
                {
                    legacyBanks = new List<IIBank>
                    {
                        new Bank()
                        {
                            Key = "Simulation INGDiba",
                            Value = "INGBNL2A"
                        },
                        new Bank()
                        {
                            Key = "Simulation Rabo Bank",
                            Value = "RABONL2U"
                        }
                    };
                    response = legacyBanks;
                }
                else if (lppId == "giropay")
                {
                    client.DefaultRequestHeaders.Clear();
                    client.DefaultRequestHeaders.Add("Authorization", Environment.GetEnvironmentVariable("CKO_PUBLIC_KEY"));
                    HttpResponseMessage result = await client.GetAsync("https://api.sandbox.checkout.com/giropay/banks");
                    string content = await result.Content.ReadAsStringAsync();
                    BanksResponse banksProcessed = JsonConvert.DeserializeObject<BanksResponse>(content);
                    response = banksProcessed;
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
        [ProducesResponseType(200, Type = typeof(PaymentProcessed))]
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
        [ProducesResponseType(200, Type = typeof(PaymentProcessed))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Actions(string paymentId)
        {
            try
            {
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("Authorization", Environment.GetEnvironmentVariable("CKO_SECRET_KEY"));
                HttpResponseMessage result = await client.GetAsync($"https://api.sandbox.checkout.com/payments/{paymentId}/actions");
                if(result.IsSuccessStatusCode)
                {
                    string content = await result.Content.ReadAsStringAsync();
                    List<object> actions = JsonConvert.DeserializeObject<List<object>>(content);
                    return Ok(actions);
                }
                else
                {
                    return NotFound();
                }
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
                    return AcceptedAtAction("RequestSource", new { paymentId = sourceResponse.Pending.Id }, sourceResponse.Pending);
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


        [HttpPost("[action]/source/token")]
        [ProducesResponseType(201, Type = typeof(PaymentProcessed))]
        [ProducesResponseType(202, Type = typeof(PaymentPending))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> Payments(PaymentRequest<TokenSource> paymentRequestModel)
        {
            try
            {
                PaymentResponse paymentResponse = await api.Payments.RequestAsync(paymentRequestModel);
                if (paymentResponse.IsPending)
                {
                    return AcceptedAtRoute("GetPayment", new { paymentId = paymentResponse.Pending.Id }, paymentResponse.Pending);
                }
                else
                {
                    return CreatedAtRoute("GetPayment", new { paymentId = paymentResponse.Payment.Id }, paymentResponse.Payment);
                }
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e);
            }
        }

        [HttpPost("[action]/source/id")]
        [ProducesResponseType(201, Type = typeof(PaymentProcessed))]
        [ProducesResponseType(202, Type = typeof(PaymentPending))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> Payments(PaymentRequest<IdSource> paymentRequestModel)
        {
            try
            {
                PaymentResponse paymentResponse = await api.Payments.RequestAsync(paymentRequestModel);
                if (paymentResponse.IsPending)
                {
                    return AcceptedAtRoute("GetPayment", new { paymentId = paymentResponse.Pending.Id }, paymentResponse.Pending);
                }
                else
                {
                    return CreatedAtRoute("GetPayment", new { paymentId = paymentResponse.Payment.Id }, paymentResponse.Payment);
                }
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e);
            }
        }

        [HttpPost("[action]/source/card")]
        [ProducesResponseType(201, Type = typeof(PaymentProcessed))]
        [ProducesResponseType(202, Type = typeof(PaymentPending))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> Payments(PaymentRequest<CardSource> paymentRequestModel)
        {
            try
            {
                PaymentResponse paymentResponse = await api.Payments.RequestAsync(paymentRequestModel);
                if (paymentResponse.IsPending)
                {
                    return AcceptedAtRoute("GetPayment", new { paymentId = paymentResponse.Pending.Id }, paymentResponse.Pending);
                }
                else
                {
                    return CreatedAtRoute("GetPayment", new { paymentId = paymentResponse.Payment.Id }, paymentResponse.Payment);
                }
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e);
            }
        }

        [HttpPost("[action]/source/alternative-payment-method")]
        [ProducesResponseType(201, Type = typeof(PaymentProcessed))]
        [ProducesResponseType(202, Type = typeof(PaymentPending))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> Payments(PaymentRequest<AlternativePaymentSource> paymentRequestModel)
        {
            try
            {
                PaymentResponse paymentResponse = await api.Payments.RequestAsync(paymentRequestModel);
                if (paymentResponse.IsPending)
                {
                    return AcceptedAtRoute("GetPayment", new { paymentId = paymentResponse.Pending.Id }, paymentResponse.Pending);
                }
                else
                {
                    return CreatedAtRoute("GetPayment", new { paymentId = paymentResponse.Payment.Id }, paymentResponse.Payment);
                }
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e);
            }
        }

    }
}
