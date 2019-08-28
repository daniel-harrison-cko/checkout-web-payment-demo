using System;
using Checkout;
using CKODemoShop.Configuration;

namespace CKODemoShop.Checkout
{
    public static class CheckoutApiFactory
    {
        public static CheckoutApi ConfiguredFromEnvironment()
        {
            var api = CheckoutApi.Create(
               secretKey: Environment.GetEnvironmentVariable("CHECKOUTAPIOPTIONS__SECRETKEY"),
               publicKey: Environment.GetEnvironmentVariable("CHECKOUTAPIOPTIONS__PUBLICKEY"),
               uri: Environment.GetEnvironmentVariable("CHECKOUTAPIOPTIONS__GATEWAYURI")
            );
            return api;
        }

        public static CheckoutApi ConfiguredFromOptions(CheckoutApiOptions options)
        {
            return CheckoutApi.Create(
               secretKey: options.SecretKey,
               publicKey: options.PublicKey,
               uri: options.GatewayUri
            );
        }
    }
}
