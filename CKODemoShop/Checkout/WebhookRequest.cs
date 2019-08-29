using Newtonsoft.Json;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace CKODemoShop.Checkout
{
    public class WebhookRequest
    {
        private const string webhooksUrl = "/api/webhooks/incoming/checkout";

        public WebhookRequest(
            string baseUrl,
            string authorization,
            List<string> eventTypes
            )
        {
            //fallback for webhook configuration from localhost which gets rejected from Gateway as invalid URL: https://webhook.site/#!/8c914904-fe43-4f2b-b2fe-07cbc6962968
            Url = Regex.Match(baseUrl, @"^http[s]{0,1}:\/\/localhost.*$").Success ? $"https://webhook.site/8c914904-fe43-4f2b-b2fe-07cbc6962968" : $"{baseUrl}{webhooksUrl}";
            Headers.Add("Authorization", authorization);
            EventTypes = eventTypes;
        }

        public string Url { get; }
        public bool Active { get; } = true;
        public Dictionary<string, string> Headers { get; } = new Dictionary<string, string>();
        [JsonProperty(PropertyName = "content_type")]
        public string ContentType { get; } = "json";
        [JsonProperty(PropertyName = "event_types")]
        public List<string> EventTypes { get; }
    }
}
