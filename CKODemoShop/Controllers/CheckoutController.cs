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
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using CKODemoShop.Configuration;
using Microsoft.Extensions.Options;

namespace CKODemoShop.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class CheckoutController : Controller
    {
        private CheckoutApiOptions apiOptions;
        private CheckoutApi api;
        private HttpClient client;

        public CheckoutController(IOptions<CheckoutApiOptions> apiOptions, CheckoutApi api, HttpClient client)
        {
            this.apiOptions = apiOptions.Value ?? throw new ArgumentNullException(nameof(apiOptions));
            this.api = api ?? throw new ArgumentNullException(nameof(api));
            this.client = client ?? throw new ArgumentNullException(nameof(client));
        }

        [HttpGet("{lppId}/[action]", Name = "GetBanks")]
        [ActionName("Banks")]
        [ProducesResponseType(200, Type = typeof(IList<IBank>))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetBanks(string lppId)
        {
            object response;
            try
            {
                if (lppId == "eps")
                {
                    client.DefaultRequestHeaders.Clear();
                    client.DefaultRequestHeaders.Add("Authorization", apiOptions.PublicKey);
                    HttpResponseMessage result = await client.GetAsync($"{apiOptions.GatewayUri}/giropay/eps/banks");
                    string content = await result.Content.ReadAsStringAsync();
                    BanksResponse banksResponse = JsonConvert.DeserializeObject<BanksResponse>(content);
                    response = banksResponse;
                }
                else if (lppId == "giropay")
                {
                    client.DefaultRequestHeaders.Clear();
                    client.DefaultRequestHeaders.Add("Authorization", apiOptions.PublicKey);
                    HttpResponseMessage result = await client.GetAsync($"{apiOptions.GatewayUri}/giropay/banks");
                    string content = await result.Content.ReadAsStringAsync();
                    BanksResponse banksResponse = JsonConvert.DeserializeObject<BanksResponse>(content);
                    response = banksResponse;
                }
                else if (lppId == "ideal")
                {
                    client.DefaultRequestHeaders.Clear();
                    client.DefaultRequestHeaders.Add("Authorization", apiOptions.PublicKey);
                    HttpResponseMessage result = await client.GetAsync($"{apiOptions.GatewayUri}/ideal-external/issuers");
                    string content = await result.Content.ReadAsStringAsync();
                    IssuersResponse issuersResponse = JsonConvert.DeserializeObject<IssuersResponse>(content);
                    response = issuersResponse;
                }
                else
                {
                    throw new KeyNotFoundException();
                }
                return Ok(response);
            }
            catch(Exception e)
            {
                return NotFound(e.Message);
            }
        }

        [HttpPost("[action]/source/card", Name = "RequestCardToken")]
        [ActionName("Tokens")]
        [ProducesResponseType(201, Type = typeof(TokenResponse))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> RequestCardToken(CardTokenRequest tokenRequest)
        {
            try
            {
                var tokenResponse = await api.Tokens.RequestAsync(tokenRequest);
                return CreatedAtAction(nameof(RequestCardToken), tokenResponse);
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e.Message);
            }
        }

        [HttpPost("[action]/source/wallet", Name = "RequestWalletToken")]
        [ActionName("Tokens")]
        [ProducesResponseType(201, Type = typeof(TokenResponse))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> RequestWalletToken(WalletTokenRequest tokenRequest)
        {
            try
            {
                var tokenResponse = await api.Tokens.RequestAsync(tokenRequest);
                return CreatedAtAction(nameof(RequestWalletToken), tokenResponse);
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e.Message);
            }
        }

        [HttpGet("[action]/{paymentId}", Name = "GetPayment")]
        [ActionName("Payments")]
        [ProducesResponseType(200, Type = typeof(GetPaymentResponse))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetPayment(string paymentId)
        {
            try
            {
                GetPaymentResponse paymentResponse = await api.Payments.GetAsync(paymentId);
                return Ok(paymentResponse);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("payments/{paymentId}/[action]", Name = "GetActions")]
        [ActionName("Actions")]
        [ProducesResponseType(200, Type = typeof(IEnumerable<PaymentAction>))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetActions(string paymentId)
        {
            try
            {
                var actions = await api.Payments.GetActionsAsync(paymentId);
                return Ok(actions);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("[action]", Name = "GetEventTypes")]
        [ActionName("EventTypes")]
        [ProducesResponseType(200, Type = typeof(IEnumerable<object>))]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetEventTypes()
        {
            client.DefaultRequestHeaders.Clear();
            try
            {
                client.DefaultRequestHeaders.Add("Authorization", apiOptions.SecretKey);
                HttpResponseMessage result = await client.GetAsync($"{apiOptions.GatewayUri}/event-types");
                string content = await result.Content.ReadAsStringAsync();
                var response = JsonConvert.DeserializeObject(content);
                return Ok(response);
            }
            catch (Exception e)
            {
                return NotFound(e.Message);
            }
        }

        [HttpGet("[action]", Name = "GetWebhooks")]
        [ActionName("Webhooks")]
        [ProducesResponseType(200, Type = typeof(IEnumerable<object>))]
        [ProducesResponseType(204)]
        public async Task<IActionResult> GetWebhooks()
        {
            client.DefaultRequestHeaders.Clear();
            try
            {
                client.DefaultRequestHeaders.Add("Authorization", apiOptions.SecretKey);
                HttpResponseMessage result = await client.GetAsync($"{apiOptions.GatewayUri}/webhooks");
                if(result.StatusCode == System.Net.HttpStatusCode.NoContent)
                {
                    return NoContent();
                }
                else
                {
                    string content = await result.Content.ReadAsStringAsync();
                    var response = JsonConvert.DeserializeObject(content);
                    return Ok(response);
                }
            }
            catch (Exception e)
            {
                return NotFound(e.Message);
            }
        }

        [HttpPost("[action]", Name = "AddWebhook")]
        [ActionName("Webhooks")]
        [ProducesResponseType(201, Type = typeof(object))]
        [ProducesResponseType(409)]
        [ProducesResponseType(422)]
        public async Task<IActionResult> AddWebhook([FromBody] List<string> eventTypes)
        {
            var baseUrl = $"https://{HttpContext.Request.Host}{HttpContext.Request.PathBase}";
            var webhookRequest = new WebhookRequest(baseUrl, "384021d9-c1ac-4ead-b0d2-b8a8430f409b", eventTypes);

            client.DefaultRequestHeaders.Clear();
            try
            {
                client.DefaultRequestHeaders.Add("Authorization", apiOptions.SecretKey);
                HttpResponseMessage result = await client.PostAsJsonAsync($"{apiOptions.GatewayUri}/webhooks", webhookRequest);
                string content = await result.Content.ReadAsStringAsync();
                object response = JsonConvert.DeserializeObject<object>(content);
                if (result.StatusCode == System.Net.HttpStatusCode.UnprocessableEntity)
                {
                    return UnprocessableEntity(response);
                }
                else if (result.StatusCode == System.Net.HttpStatusCode.Conflict)
                {
                    return Conflict();
                }
                else
                {
                    return CreatedAtAction(nameof(AddWebhook), response);
                }
            }
            catch (Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }

        [HttpDelete("[action]", Name = "ClearWebhooks")]
        [ActionName("Webhooks")]
        [ProducesResponseType(201, Type = typeof(object))]
        [ProducesResponseType(409)]
        [ProducesResponseType(422)]
        public async Task<IActionResult> ClearWebhooks()
        {
            List<Task> deletions = new List<Task>();
            async Task<IActionResult> deleteWebhook(string webhookId)
            {
                client.DefaultRequestHeaders.Clear();
                try
                {
                    client.DefaultRequestHeaders.Add("Authorization", apiOptions.SecretKey);
                    HttpResponseMessage result = await client.DeleteAsync($"{apiOptions.GatewayUri}/webhooks/{webhookId}");
                    if (result.IsSuccessStatusCode)
                    {
                        return Ok();
                    }
                    else
                    {
                        return NotFound();
                    }
                }
                catch (Exception e)
                {
                    return UnprocessableEntity(e.Message);
                }
            };
            var webhooks = await GetWebhooks();
            var serializedWebhooksResponse = JsonConvert.SerializeObject((webhooks as ObjectResult).Value);
            var deserializedWebhooksResponse = JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(serializedWebhooksResponse);
            var webhookIds = deserializedWebhooksResponse.Select(webhook => webhook["id"] as string).ToList();

            foreach(string webhookId in webhookIds)
            {
                deletions.Add(deleteWebhook(webhookId));
            }

            await Task.WhenAll(deletions);

            return Ok();
        }

        [HttpPost("[action]", Name = "RequestSource")]
        [ActionName("Sources")]
        [ProducesResponseType(201, Type = typeof(SourceResponse))]
        [ProducesResponseType(202, Type = typeof(SourceResponse))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> RequestSource(SourceRequest sourceRequest)
        {
            try
            {
                var sourceResponse = await api.Sources.RequestAsync(sourceRequest);
                if (sourceResponse.IsPending)
                {
                    throw new NotImplementedException("There is no use case for SourceResponse.Pending yet.");
                }
                else
                {
                    return CreatedAtAction(nameof(RequestSource), new { paymentId = sourceResponse.Source.Id }, sourceResponse.Source);
                }
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e.Message);
            }
        }

        [HttpPost("[action]", Name = "RequestPayment")]
        [ActionName("Payments")]
        [ProducesResponseType(201, Type = typeof(PaymentProcessed))]
        [ProducesResponseType(202, Type = typeof(PaymentPending))]
        [ProducesResponseType(422, Type = typeof(ErrorResponse))]
        public async Task<IActionResult> RequestPayment(PaymentRequest request)
        {
            string baseUrl;
            if(HttpContext.Request.Host.ToString().Contains("localhost"))
            {
                baseUrl = $"{HttpContext.Request.Scheme}://{HttpContext.Request.Host}{HttpContext.Request.PathBase}";
            }
            else
            {
                baseUrl = $"https://{HttpContext.Request.Host}{HttpContext.Request.PathBase}";
            }
            var paymentRequest = new PaymentRequest<IRequestSource>(
                request.Source,
                request.Currency,
                request.Amount
                )
            {
                Capture = request.Capture,
                ThreeDS = request.ThreeDs,
                Reference = request.Reference ?? $"cko_demo_{Guid.NewGuid()}",
                PaymentIp = HttpContext.Connection.RemoteIpAddress.ToString(),
                SuccessUrl = $"{baseUrl}/order/succeeded",
                FailureUrl = $"{baseUrl}/order/failed"
            };
            try
            {
                PaymentResponse paymentResponse = await api.Payments.RequestAsync(paymentRequest);
                if (paymentResponse.IsPending)
                {
                    return AcceptedAtAction(nameof(RequestPayment), new { paymentId = paymentResponse.Pending.Id }, paymentResponse.Pending);
                }
                else
                {
                    return CreatedAtAction(nameof(RequestPayment), new { paymentId = paymentResponse.Payment.Id }, paymentResponse.Payment);
                }
            }
            catch (Exception e)
            {
                return UnprocessableEntity(e);
            }
        }

        [HttpPost("[action]", Name = "RequestHypermedia")]
        [ActionName("Hypermedia")]
        [ProducesResponseType(202, Type = typeof(object))]
        [ProducesResponseType(400)]
        public async Task<IActionResult> RequestHypermedia(HypermediaRequest hypermediaRequest)
        {
            try
            {
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("Authorization", apiOptions.SecretKey);
                HttpResponseMessage result;
                switch (hypermediaRequest.HttpMethod)
                {
                    case "POST":
                        result = await client.PostAsJsonAsync(hypermediaRequest.Link, hypermediaRequest.Payload);
                        break;
                    case "PUT":
                        result = await client.PutAsJsonAsync(hypermediaRequest.Link, hypermediaRequest.Payload);
                        break;
                    default:
                        result = await client.PostAsJsonAsync(hypermediaRequest.Link, hypermediaRequest.Payload);
                        break;
                }
                if (!result.IsSuccessStatusCode) throw new Exception(result.ReasonPhrase);
                string content = await result.Content.ReadAsStringAsync();
                return AcceptedAtAction(nameof(RequestHypermedia), JsonConvert.DeserializeObject(content));
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpPost("[action]", Name = "RequestKlarnaCreditSession")]
        [ActionName("KlarnaCreditSessions")]
        [ProducesResponseType(201, Type = typeof(GetPaymentResponse))]
        [ProducesResponseType(400)]
        public async Task<IActionResult> RequestKlarnaCreditSession(KlarnaSessionRequest sessionRequest)
        {
            try
            {
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("Authorization", apiOptions.PublicKey);
                HttpResponseMessage result = await client.PostAsJsonAsync($"{apiOptions.GatewayUri}/klarna-external/credit-sessions", sessionRequest);
                string content = await result.Content.ReadAsStringAsync();
                return CreatedAtAction(nameof(RequestKlarnaCreditSession), content);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }
    }
}
