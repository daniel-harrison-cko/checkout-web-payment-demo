using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

namespace CKODemoShop.Controllers
{
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
