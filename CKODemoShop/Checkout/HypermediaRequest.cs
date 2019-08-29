using Checkout.Payments;
using Newtonsoft.Json;

namespace CKODemoShop.Checkout
{
    public class HypermediaRequest
    {
        public string Link { get; set; }
        public object Payload { get; set; }
        public string HttpMethod { get; set; }
    }
}
