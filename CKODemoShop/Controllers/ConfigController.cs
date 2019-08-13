using System;
using CKODemoShop.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Serilog;

namespace CKODemoShop.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ConfigController : Controller
    {
        private readonly ILogger _logger;
        private readonly OktaWebClientOptions _options;

        public ConfigController(ILogger logger, IOptions<OktaWebClientOptions> options)
        {
            
            _logger = logger.ForContext<ConfigController>();
            _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        }

        public IActionResult GetConfig()
        {
            var model = new 
            {
                Issuer = _options.Issuer,
                ClientId = _options.ClientId
            };
            return Ok(model);
        }

        [HttpGet("[action]", Name = "GetPublicKey")]
        [ActionName("PublicKey")]
        [ProducesResponseType(200, Type = typeof(string))]
        [ProducesResponseType(404)]
        public IActionResult GetPublicKey()
        {
            try
            {
                return Ok(new { PublicKey = Environment.GetEnvironmentVariable("CKO_PUBLIC_KEY") });
            }
            catch (Exception e)
            {
                return NotFound(e.Message);
            }
        }
    }
}