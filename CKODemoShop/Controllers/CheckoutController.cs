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

        [HttpGet("[action]/{lppId}")]
        [ProducesResponseType(200, Type = typeof(List<IIssuer>))]
        [ProducesResponseType(400)]
        public IActionResult Issuers(string lppId)
        {
            try
            {
                return Ok(new List<IIssuer> {
                    new Issuer()
                    {
                        Key = "Issuer Simulation V3 - ING",
                        Value = "INGBNL2A"
                    }
                });
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

        public class Issuer : IIssuer
        {
            public string Key { get; set; }
            public string Value { get; set; }
        }

        public interface IIssuer
        {
            string Key { get; set; }
            string Value { get; set; }
        }
    }
}
