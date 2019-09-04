using System;
using CKODemoShop.Configuration;
using Microsoft.AspNetCore.Hosting;
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
        private readonly IHostingEnvironment _hostingEnvironment;
        private readonly OktaWebClientOptions _options;
        private readonly CheckoutApiOptions _apiOptions;

        public ConfigController(
            ILogger logger,
            IHostingEnvironment hostingEnvironment,
            IOptions<OktaWebClientOptions> options, 
            IOptions<CheckoutApiOptions> apiOptions
            )
        {
            _logger = logger?.ForContext<ConfigController>() ?? throw new ArgumentNullException(nameof(logger));
            _hostingEnvironment = hostingEnvironment ?? throw new ArgumentNullException(nameof(hostingEnvironment));
            _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
            _apiOptions = apiOptions?.Value ?? throw new ArgumentNullException(nameof(apiOptions));
        }

        public IActionResult GetConfig()
        {
            var model = new 
            {
                Environment = _hostingEnvironment.EnvironmentName,
                Issuer = _options.Issuer,
                ClientId = _options.ClientId,
                PublicKey = _apiOptions.PublicKey
            };
            return Ok(model);
        }
    }
}