using Moq;
using NSpec;
using Shouldly;
using CKODemoShop.Controllers;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using CKODemoShop.Checkout;
using Microsoft.AspNetCore.Http;
using Checkout.Common;
using System;
using Checkout.Payments;
using Checkout.Tokens;
using Checkout.Sources;
using System.Net.Http;
using CKODemoShop.Configuration;

namespace CKODemoShop.Tests
{
    [Tag("checkout")]
    public class describe_checkout_controller : nspec
    {
        CheckoutController controller;
        IActionResult result;

        void before_all()
        {
            controller = new CheckoutController(new CheckoutApiOptions(), CheckoutApiFactory.ConfiguredFromEnvironment(), new HttpClient());
            Console.WriteLine("CheckoutController instantiated");
        }

        string lppId;
        IssuersResponse legacyBanks;
        BanksResponse banks;
        void when_get_banks()
        {
            context["given ~/ideal/banks"] = () =>
            {
                beforeAllAsync = async () =>
                {
                    lppId = "ideal";
                    result = await controller.GetBanks(lppId);
                    legacyBanks = (result as ObjectResult).Value as IssuersResponse;
                };

                it["should return 200 - OK"] = () =>
                {
                    (result as OkObjectResult).StatusCode.ShouldBe(StatusCodes.Status200OK);
                };

                it["should return a non-empty list of legacy typed banks"] = () =>
                {
                    legacyBanks.Countries.ShouldNotBeNull();
                };

                it["should contain single legacy typed bank with name 'Issuer Simulation V3 - ING' and bic 'INGBNL2A'"] = () =>
                {
                    legacyBanks.Countries.Single(country => (country.Issuers.First().Name == "Issuer Simulation V3 - ING" && country.Issuers.First().Bic == "INGBNL2A"));
                };
            };

            context["given ~/giropay/banks"] = () =>
            {
                beforeAllAsync = async () =>
                {
                    lppId = "giropay";
                    result = await controller.GetBanks(lppId);
                    banks = (result as ObjectResult).Value as BanksResponse;
                };

                it["should return 200 - OK"] = () =>
                {
                    (result as OkObjectResult).StatusCode.ShouldBe(StatusCodes.Status200OK);
                };

                it["should return True for property 'HasBanks'"] = () =>
                {
                    banks.HasBanks.ShouldBeTrue();
                };

                it["should return a type of Dictionary<string, string> for property 'Banks'"] = () =>
                {
                    banks.Banks.ShouldBeOfType<Dictionary<string, string>>();
                };

                it["should return a non-empty Dictionary for property 'Banks'"] = () =>
                {
                    banks.Banks.Count.ShouldBeGreaterThan(0);
                };

                it["should contain KeyValuePair 'TESTDETT421': 'giropay Testinstitut'"] = () =>
                {
                    banks.Banks.ShouldContainKeyAndValue("TESTDETT421", "giropay Testinstitut");
                };
            };

            context["given ~/ducks/banks"] = () =>
            {
                beforeAllAsync = async () =>
                {
                    lppId = "ducks";
                    result = await controller.GetBanks(lppId);
                };

                it["should return 404 - Not Found"] = () =>
                {
                    (result as NotFoundObjectResult).StatusCode.ShouldBe(StatusCodes.Status404NotFound);
                };
            };
        }

        CardTokenRequest tokenRequest;
        TokenResponse token;
        void when_post_tokens()
        {
            context["given a card token request"] = () =>
            {
                context["that is valid"] = () =>
                {
                    beforeAllAsync = async () =>
                    {
                        tokenRequest = new CardTokenRequest(number: "4242424242424242", expiryMonth: 12, expiryYear: 2022);
                        result = await controller.RequestCardToken(tokenRequest);
                        token = (result as ObjectResult).Value as TokenResponse;
                    };

                    it["should return 201 - Created"] = () =>
                    {
                        (result as CreatedAtActionResult).StatusCode.ShouldBe(StatusCodes.Status201Created);
                    };

                    context["with token that"] = () =>
                    {
                        it["should not be null"] = () =>
                        {
                            token.ShouldNotBeNull();
                        };

                        it["should expire in 15m"] = () =>
                        {
                            var expiration = (token as CardTokenResponse).ExpiresOn;
                            var now = DateTime.UtcNow;
                            (expiration - now).Minutes.ShouldBeLessThanOrEqualTo(15);
                        };

                        it["should match type of request"] = () =>
                        {
                            token.Type.ShouldBe(tokenRequest.Type);
                        };

                        it["should match expiry month of request"] = () =>
                        {
                            (token as CardTokenResponse).ExpiryMonth.ShouldBe((tokenRequest as CardTokenRequest).ExpiryMonth);
                        };

                        it["should match expiry year of request"] = () =>
                        {
                            (token as CardTokenResponse).ExpiryYear.ShouldBe((tokenRequest as CardTokenRequest).ExpiryYear);
                        };

                        it["should match last4 digits of request number"] = () =>
                        {
                            (tokenRequest as CardTokenRequest).Number.ShouldEndWith((token as CardTokenResponse).Last4);
                        };

                        it["should have expires_on field"] = () =>
                        {
                            (token as CardTokenResponse).ExpiresOn.ShouldNotBeNull();
                        };
                    };
                };
            };
        }

        string currency;
        int amount;
        Resource payment;
        Exception exception;
        void when_post_payments()
        {
            context["given card token source"] = () =>
            {
                PaymentRequest paymentRequest;
                context["that is valid"] = () =>
                {
                    beforeAllAsync = async () =>
                    {
                        currency = Currency.EUR;
                        amount = 100;
                        paymentRequest = new PaymentRequest(new Source() { {"type", "token" }, { "token", token.Token } }, amount, currency);
                        result = await controller.RequestPayment(paymentRequest);
                        payment = (result as ObjectResult).Value as Resource;
                    };

                    it["should return 201 - Created"] = () =>
                    {
                        (result as CreatedAtRouteResult).StatusCode.ShouldBe(StatusCodes.Status201Created);
                    };

                    context["with payment that"] = () =>
                    {
                        it["should not be null"] = () =>
                        {
                            payment.ShouldNotBeNull();
                        };

                        it["should be of type Payment Processed"] = () =>
                        {
                            payment.ShouldBeOfType<PaymentProcessed>();
                        };

                        it["should have status that is not Pending "] = () =>
                        {
                            (payment as PaymentProcessed).Status.ShouldNotBe(PaymentStatus.Pending);
                        };
                    };
                };
            };

            context["given giropay payment source"] = () =>
            {
                PaymentRequest paymentRequest;
                context["that is valid"] = () =>
                {
                    beforeAllAsync = async () =>
                    {
                        currency = Currency.EUR;
                        amount = 100;
                        paymentRequest = new PaymentRequest(new Source() { {"type", "giropay" }, {"bic", "TESTDETT421" }, {"purpose", "Web Payment Demo Unit Test" } }, amount, currency);
                        result = await controller.RequestPayment(paymentRequest);
                        payment = (result as ObjectResult).Value as Resource;
                    };

                    it["should return 202 - Accepted"] = () =>
                    {
                        (result as AcceptedAtRouteResult).StatusCode.ShouldBe(StatusCodes.Status202Accepted);
                    };

                    context["with payment that"] = () =>
                    {
                        it["should not be null"] = () =>
                        {
                            payment.ShouldNotBeNull();
                        };

                        it["should be of type PaymentPending"] = () =>
                        {
                            payment.ShouldBeOfType<PaymentPending>();
                        };

                        it["should require redirect"] = () =>
                        {
                            (payment as PaymentPending).RequiresRedirect().ShouldBeTrue();
                        };

                        it["should have status that is Pending"] = () =>
                        {
                            (payment as PaymentPending).Status.ShouldBe(PaymentStatus.Pending);
                        };

                        it["should have a redirect link"] = () =>
                        {
                            (payment as PaymentPending).GetRedirectLink().ShouldNotBeNull();
                        };
                    };
                };

                context["that is incomplete"] = () =>
                {
                    beforeAllAsync = async () =>
                    {
                        currency = Currency.EUR;
                        amount = 100;
                        paymentRequest = new PaymentRequest(new Source() { {"type", "giropay" }, {"purpose", "bic_required test" } }, amount, currency);
                        result = await controller.RequestPayment(paymentRequest);
                        exception = (result as ObjectResult).Value as Exception;
                    };

                    it["should return 422 - Invalid data was sent"] = () =>
                    {
                        (result as UnprocessableEntityObjectResult).StatusCode.ShouldBe(StatusCodes.Status422UnprocessableEntity);
                    };

                    context["with exception that"] = () =>
                    {
                        it["should be thrown due to error: bic_required"] = () =>
                        {
                            exception.Message.ShouldContain("bic_required");
                        };
                    };
                };

                context["that is invalid"] = () =>
                {
                    beforeAllAsync = async () =>
                    {
                        currency = Currency.USD;
                        amount = 100;
                        paymentRequest = new PaymentRequest(new Source() { { "type", "giropay" }, { "bic", "TESTDETT421" }, { "purpose", "Web Payment Demo Unit Test" } }, amount, currency);
                        result = await controller.RequestPayment(paymentRequest);
                        exception = (result as ObjectResult).Value as Exception;
                    };

                    it["should return 422 - Invalid data was sent"] = () =>
                    {
                        (result as UnprocessableEntityObjectResult).StatusCode.ShouldBe(StatusCodes.Status422UnprocessableEntity);
                    };

                    context["with exception that"] = () =>
                    {
                        it["should be thrown due to error: payment_method_not_supported"] = () =>
                        {
                            exception.Message.ShouldContain("payment_method_not_supported");
                        };
                    };
                };
            };

            context["given ideal payment source"] = () =>
            {
                PaymentRequest paymentRequest;
                context["that is valid"] = () =>
                {
                    beforeAllAsync = async () =>
                    {
                        var source = new Source() { { "type", "ideal" }, {"bic", "INGBNL2A" }, {"description", "Web Payment Demo Unit Test" } };
                        currency = Currency.EUR;
                        amount = 100;
                        paymentRequest = new PaymentRequest(source, amount, currency);
                        result = await controller.RequestPayment(paymentRequest);
                        payment = (result as ObjectResult).Value as Resource;
                    };

                    it["should return 202 - Accepted"] = () =>
                    {
                        (result as AcceptedAtRouteResult).StatusCode.ShouldBe(StatusCodes.Status202Accepted);
                    };

                    context["with payment that"] = () =>
                    {
                        it["should not be null"] = () =>
                        {
                            payment.ShouldNotBeNull();
                        };

                        it["should be of type PaymentPending"] = () =>
                        {
                            payment.ShouldBeOfType<PaymentPending>();
                        };

                        it["should require redirect"] = () =>
                        {
                            (payment as PaymentPending).RequiresRedirect().ShouldBeTrue();
                        };

                        it["should have status that is Pending"] = () =>
                        {
                            (payment as PaymentPending).Status.ShouldBe(PaymentStatus.Pending);
                        };

                        it["should have a redirect link"] = () =>
                        {
                            (payment as PaymentPending).GetRedirectLink().ShouldNotBeNull();
                        };
                    };
                };

                context["that is incomplete"] = () =>
                {
                    beforeAllAsync = async () =>
                    {
                        currency = Currency.EUR;
                        amount = 100;
                        paymentRequest = new PaymentRequest(new Source() { {"type", "ideal" } }, amount, currency);
                        result = await controller.RequestPayment(paymentRequest);
                        exception = (result as ObjectResult).Value as Exception;
                    };

                    it["should return 422 - Invalid data was sent"] = () =>
                    {
                        (result as UnprocessableEntityObjectResult).StatusCode.ShouldBe(StatusCodes.Status422UnprocessableEntity);
                    };

                    context["with exception that"] = () =>
                    {
                        it["should be thrown due to error: InternalServerError"] = () =>
                        {
                            Console.WriteLine(exception.Message);
                            exception.Message.ShouldContain("InternalServerError");
                        };
                    };
                };

                context["that is invalid"] = () =>
                {
                    beforeAllAsync = async () =>
                    {
                        var source = new Source() { {"type", "ideal" }, {"bic", "INGBNL2A" }, { "description", "Web Payment Demo Unit Test" } };
                        currency = Currency.USD;
                        amount = 100;
                        paymentRequest = new PaymentRequest(source, amount, currency);
                        result = await controller.RequestPayment(paymentRequest);
                        exception = (result as ObjectResult).Value as Exception;
                    };

                    it["should return 422 - Invalid data was sent"] = () =>
                    {
                        (result as UnprocessableEntityObjectResult).StatusCode.ShouldBe(StatusCodes.Status422UnprocessableEntity);
                    };

                    context["with exception that"] = () =>
                    {
                        it["should be thrown due to error: payment_method_not_supported"] = () =>
                        {
                            exception.Message.ShouldContain("payment_method_not_supported");
                        };
                    };
                };
            };
        }

        GetPaymentResponse getPayment;
        void when_get_payments()
        {
            context["given a valid request"] = () =>
            {
                PaymentRequest paymentRequest;
                beforeAllAsync = async () =>
                {
                    var source = new Source() { {"type", "ideal" }, {"bic", "INGBNL2A" }, { "description", "Web Payment Demo Unit Test" } };

                    currency = Currency.EUR;
                    amount = 100;
                    paymentRequest = new PaymentRequest(source, amount, currency);
                    result = await controller.RequestPayment(paymentRequest); // POST payments
                    payment = (result as ObjectResult).Value as Resource;
                    result = await controller.GetPayment((payment as PaymentPending).Id); // GET payments
                    getPayment = (result as ObjectResult).Value as GetPaymentResponse;
                };

                it["should return 200 - OK"] = () =>
                {
                    (result as OkObjectResult).StatusCode.ShouldBe(StatusCodes.Status200OK);
                };

                it["should return the correct payment"] = () =>
                {
                    (getPayment as GetPaymentResponse).Id.ShouldBe((payment as PaymentPending).Id);
                };
            };
        }

        SourceRequest sourceRequest;
        Resource source;
        void when_post_sources()
        {
            context["given a sepa source"] = () =>
            {
                beforeAllAsync = async () =>
                {
                    sourceRequest = new SourceRequest(
                        type: "sepa",
                        billingAddress: new Address()
                        {
                            AddressLine1 = "Checkout GmbH",
                            AddressLine2 = "Rudi-Dutschke-Strasse 26",
                            City = "Berlin",
                            Zip = "10969",
                            State = "Berlin",
                            Country = "DE"
                        })
                    {
                        Reference = "CKO Demo test",
                        Phone = new Phone()
                        {
                            CountryCode = "+49",
                            Number = "3088789157"
                        },
                        SourceData = new SourceData()
                        {
                            { "first_name", "Marcus" },
                            { "last_name", "Barrilius Maximus" },
                            { "account_iban", "DE25100100101234567893" },
                            { "bic", "PBNKDEFFXXX" },
                            { "billing_descriptor", "CKO Demo test" },
                            { "mandate_type", "single" }
                        }
                    };
                    result = await controller.RequestSource(sourceRequest);
                    source = (result as ObjectResult).Value as Resource;
                };

                it["should return 201 - Created"] = () =>
                {
                    (result as CreatedAtActionResult).StatusCode.ShouldBe(StatusCodes.Status201Created);
                };

                it["should match request source type with response source type"] = () =>
                {
                    (source as SourceProcessed).Type.ToLower().ShouldBe(sourceRequest.Type.ToLower());
                };

                it["should return a mandate reference"] = () =>
                {
                    (source as SourceProcessed).ResponseData["mandate_reference"].ShouldNotBeNull();
                };
            };
        }

        void when_get_hypermedia_actions()
        {
            context["given a valid paymentId"] = () =>
            {
                PaymentRequest paymentRequest;
                beforeAllAsync = async () =>
                {
                    currency = Currency.EUR;
                    amount = 100;
                    paymentRequest = new PaymentRequest(new Source() { {"type", "card" }, { "number", "4242424242424242" }, { "expiry_month", 12 }, { "expiry_year", 2022 } }, amount, currency);
                    result = await controller.RequestPayment(paymentRequest); // POST payments
                    payment = (result as ObjectResult).Value as Resource;
                    result = await controller.GetActions((payment as PaymentProcessed).Id);
                };

                it["should return 200 - OK"] = () =>
                {
                    (result as OkObjectResult).StatusCode.ShouldBe(StatusCodes.Status200OK);
                };

                it["should return actions"] = () =>
                {
                    var actions = (result as OkObjectResult).Value;
                    actions.ShouldNotBeNull();
                };
            };
        }
    }
}
