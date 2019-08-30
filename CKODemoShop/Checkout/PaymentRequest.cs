using Checkout.Payments;
using Newtonsoft.Json;

namespace CKODemoShop.Checkout
{
    public class PaymentRequest
    {
        public PaymentRequest(
            Source source,
            int amount,
            string currency,
            string reference = null,
            string description = null,
            bool capture = true,
            ShippingDetails shipping = null,
            ThreeDSRequest threeDs = null
            )
        {
            Source = source;
            Amount = amount;
            Currency = currency;
            Reference = reference;
            Description = description;
            Capture = capture;
            Shipping = shipping;
            ThreeDs = threeDs;
        }

        public Source Source { get; }
        public int Amount { get; }
        public string Currency { get; }
        public string Reference { get; }
        public string Description { get; set; }
        public bool Capture { get; set; }
        public ShippingDetails Shipping { get; set; }
        [JsonProperty(PropertyName = "3ds")]
        public ThreeDSRequest ThreeDs { get; set; }
    }
}
