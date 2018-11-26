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
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace CKODemoShop.Controllers
{
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
                else if (lppId == "lpp_giropay")
                {
                    client.DefaultRequestHeaders.Clear();
                    client.DefaultRequestHeaders.Add("Authorization", Environment.GetEnvironmentVariable("CKO_SECRET_KEY"));
                    HttpResponseMessage result = await client.GetAsync("https://nginxtest.ckotech.co/giropay-external/banks");
                    string content = await result.Content.ReadAsStringAsync();
                    //BanksResponse banksProcessed = JsonConvert.DeserializeObject<BanksResponse>(content);
                    //response = banksProcessed;
                }
                else
                {
                    throw new KeyNotFoundException();
                }
                return Ok(response);
            }
            catch(Exception e)
            {
                Console.Error.WriteLine(e.Message);
                return NotFound();
            }
        }

        [HttpPost("[action]")]
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
                Console.WriteLine(e);
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

        [HttpPost("[action]", Name = "GetPayments")]
        [ProducesResponseType(200, Type = typeof(List<GetPaymentResponse>))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Payments(List<string> paymentIds)
        {
            var payments = new List<GetPaymentResponse>();
            try
            {
                foreach(string paymentId in paymentIds)
                {
                    var payment = await api.Payments.GetAsync(paymentId);
                    payments.Add(payment);
                }
                return Ok(payments);
            }
            catch (Exception e)
            {
                return BadRequest(e);
            }
        }

        [HttpPost("[action]")]
        [ProducesResponseType(201, Type = typeof(PaymentProcessed))]
        [ProducesResponseType(202, Type = typeof(PaymentPending))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> TokenPayments(PaymentRequest<TokenSource> paymentRequestModel)
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

        [HttpPost("[action]")]
        [ProducesResponseType(201, Type = typeof(PaymentProcessed))]
        [ProducesResponseType(202, Type = typeof(PaymentPending))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> AlternativePayments(PaymentRequest<AlternativePaymentSource> paymentRequestModel)
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
