using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

namespace CKODemoShop.Controllers
{
    [Route("api/[controller]")]
    public class CheckoutController : Controller
    {

        [HttpGet("[action]/{lppId}")]
        [ProducesResponseType(200, Type = typeof(IIssuer[]))]
        [ProducesResponseType(400)]
        public IActionResult GetIssuers(string lppId)
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
