using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Checkout;
using Checkout.Common;
using Checkout.Payments;
using System.Threading.Tasks;
using CKODemoShop.Checkout;
using System.Net.Http;
using Newtonsoft.Json;

namespace CKODemoShop.Controllers
{
    [Route("api/[controller]")]
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
                Console.Error.WriteLine(e.Message);
                return NotFound();
            }
        }

        [HttpPost("[action]")]
        [ProducesResponseType(202, Type = typeof(PaymentResponse))]
        [ProducesResponseType(400)]
        public async Task<IActionResult> Payments([FromBody] PaymentRequest<AlternativePaymentSource> paymentRequestModel)
        {
            try
            {
                PaymentResponse paymentResponse = await api.Payments.RequestAsync(paymentRequestModel);
                return Accepted(paymentResponse);
            }
            catch (Exception e)
            {
                Console.Error.WriteLine(e.Message);
                return BadRequest();
            }
        }
    }
}
