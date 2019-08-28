using System;
using Checkout;
using CKODemoShop.Configuration;

namespace CKODemoShop.Checkout
{
    public static class CheckoutApiFactory
    {
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
