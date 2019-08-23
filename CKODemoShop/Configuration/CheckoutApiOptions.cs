using System;

namespace CKODemoShop.Configuration
{
    public class CheckoutApiOptions 
    {
        private string _SecretKey = Environment.GetEnvironmentVariable("CKO_SECRET_KEY");
        private string _PublicKey = Environment.GetEnvironmentVariable("CKO_PUBLIC_KEY");

        public string SecretKey {
            get
            {
                return _SecretKey;
            }
            set
            {
                if (!string.IsNullOrEmpty(value)) _SecretKey = value;
            }
        }
        public string PublicKey {
            get
            {
                return _PublicKey;
            }
            set
            {
                if (!string.IsNullOrEmpty(value)) _PublicKey = value;
            }
        }
        public string GatewayUri { get; set; }
    }
}