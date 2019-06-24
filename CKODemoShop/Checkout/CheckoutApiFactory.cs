using System;
using Checkout;

namespace CKODemoShop.Checkout
{
    public static class CheckoutApiFactory
    {
        public static CheckoutApi ConfiguredFromEnvironment()
        {
            var liveMode = false;
            bool.TryParse(Environment.GetEnvironmentVariable("CKO_LIVE_MODE"), out liveMode);
            var api = CheckoutApi.Create(
               secretKey: Environment.GetEnvironmentVariable("CKO_SECRET_KEY"),
               publicKey: Environment.GetEnvironmentVariable("CKO_PUBLIC_KEY"),
               useSandbox: !liveMode
            );
            return api;
        }
    }
}
