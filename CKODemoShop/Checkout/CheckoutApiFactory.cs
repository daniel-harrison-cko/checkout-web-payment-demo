﻿using System;
using Checkout;
using CKODemoShop.Configuration;

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

        public static CheckoutApi ConfiguredFromOptions(CheckoutApiOptions options)
        {
            if (string.IsNullOrEmpty(options.SecretKey)) options.SecretKey = Environment.GetEnvironmentVariable("CKO_SECRET_KEY");
            if (string.IsNullOrEmpty(options.PublicKey)) options.PublicKey = Environment.GetEnvironmentVariable("CKO_PUBLIC_KEY");
            return CheckoutApi.Create(
               secretKey: options.SecretKey,
               publicKey: options.PublicKey,
               uri: options.GatewayUri
            );
        }
    }
}
