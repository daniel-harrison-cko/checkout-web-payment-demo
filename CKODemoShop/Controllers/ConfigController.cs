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
        private readonly CheckoutApiOptions _apiOptions;
        private readonly ServerOptions _serverOptions;

        public ConfigController(
            ILogger logger, 
            IOptions<OktaWebClientOptions> options, 
            IOptions<CheckoutApiOptions> apiOptions,
            IOptions<ServerOptions> serverOptions
            )
        {
            
            _logger = logger?.ForContext<ConfigController>() ?? throw new ArgumentNullException(nameof(logger));
            _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
            _apiOptions = apiOptions?.Value ?? throw new ArgumentNullException(nameof(apiOptions));
            _serverOptions = serverOptions?.Value ?? throw new ArgumentNullException(nameof(serverOptions));
        }

        public IActionResult GetConfig()
        {
            var model = new 
            {
                Environment = _serverOptions.Environment,
                Issuer = _options.Issuer,
                ClientId = _options.ClientId,
                PublicKey = _apiOptions.PublicKey
            };
            return Ok(model);
        }
    }
}