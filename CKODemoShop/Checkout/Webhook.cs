using Newtonsoft.Json;
using System.Collections.Generic;

namespace CKODemoShop.Checkout
{
    public class Webhook
    {
        public string Id { get; set; }
        public string Type { get; set; }
        [JsonProperty(PropertyName = "created_on")]
        public string CreatedOn { get; set; }
        public IDictionary<string, object> Data { get; set; }
    }
}
