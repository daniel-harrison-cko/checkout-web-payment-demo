using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Checkout;
using Checkout.Payments;
using System.Threading.Tasks;

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

        [HttpGet("{lppId}/[action]")]
        [ProducesResponseType(200, Type = typeof(IList<IIBank>))]
        [ProducesResponseType(400)]
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
                    banks = new Dictionary<string, string> {
                        {"BEVODEBBXXX", "Berliner Volksbank"},
                        {"BYLADEM1001", "Deutsche Kreditbank Berlin"},
                    };
                    response = banks;
                }
                return Ok(response);
            }
            catch(Exception e)
            {
                Console.Error.WriteLine(e.Message);
                return BadRequest();
            }
        }

        [HttpPost("[action]")]
        [ProducesResponseType(200, Type = typeof(PaymentResponse))]
        [ProducesResponseType(400)]
        public async Task<IActionResult> Payments([FromBody] PaymentRequest<AlternativePaymentSource> paymentRequestModel)
        {
            try
            {
                PaymentResponse paymentResponse = await api.Payments.RequestAsync(paymentRequestModel);
                return Ok(paymentResponse);
            }
            catch (Exception e)
            {
                Console.Error.WriteLine(e.Message);
                return BadRequest();
            }
        }

        public class Bank : IIBank
        {
            public string Key { get; set; }
            public string Value { get; set; }
        }

        public interface IIBank
        {
            string Key { get; set; }
            string Value { get; set; }
        }
    }
}
