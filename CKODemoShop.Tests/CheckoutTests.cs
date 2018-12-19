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

namespace CKODemoShop.Tests
{
    [Tag("checkout")]
    public class describe_checkout_controller : nspec
    {
        CheckoutController controller;
        IActionResult result;

        void before_all()
        {
            controller = new CheckoutController();
            Console.WriteLine("CheckoutController instantiated");
        }

        string lppId;
        List<IIBank> legacyBanks;
        BanksResponse banks;
        void when_get_banks()
        {
            context["given ~/lpp_19/banks"] = () =>
            {
                beforeAllAsync = async () =>
                {
                    lppId = "lpp_9";
                    result = await controller.Banks(lppId);
                    legacyBanks = (result as ObjectResult).Value as List<IIBank>;
                };

                it["should return 200 - OK"] = () =>
                {
                    (result as OkObjectResult).StatusCode.ShouldBe(StatusCodes.Status200OK);
                };

                it["should return a non-empty list of legacy typed banks"] = () =>
                {
                    legacyBanks.ShouldNotBeEmpty();
                };

                it["should contain single legacy typed bank with key 'Simulation INGDiba' and value 'INGBNL2A'"] = () =>
                {
                    legacyBanks.Single(bank => (bank.Key == "Simulation INGDiba" && bank.Value == "INGBNL2A"));
                };
            };

            context["given ~/giropay/banks"] = () =>
            {
                beforeAllAsync = async () =>
                {
                    lppId = "giropay";
                    result = await controller.Banks(lppId);
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
                    result = await controller.Banks(lppId);
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
                        result = await controller.Tokens(tokenRequest);
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
                TokenSource requestSource;
                PaymentRequest<TokenSource> paymentRequest;
                context["that is valid"] = () =>
                {
                    beforeAllAsync = async () =>
                    {
                        requestSource = new TokenSource(token.Token) { };
                        currency = Currency.EUR;
                        amount = 100;
                        paymentRequest = new PaymentRequest<TokenSource>(requestSource, currency, amount);
                        result = await controller.Payments(paymentRequest);
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
                AlternativePaymentSource requestSource;
                PaymentRequest<AlternativePaymentSource> paymentRequest;
                context["that is valid"] = () =>
                {
                    beforeAllAsync = async () =>
                    {
                        requestSource = new AlternativePaymentSource("giropay") { { "bic", "TESTDETT421" }, { "purpose", "CKO Demo Shop unit test" } };
                        currency = Currency.EUR;
                        amount = 100;
                        paymentRequest = new PaymentRequest<AlternativePaymentSource>(requestSource, currency, amount);
                        result = await controller.Payments(paymentRequest);
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
                        requestSource = new AlternativePaymentSource("giropay") { { "purpose", "bic_required test" } };
                        currency = Currency.EUR;
                        amount = 100;
                        paymentRequest = new PaymentRequest<AlternativePaymentSource>(requestSource, currency, amount);
                        result = await controller.Payments(paymentRequest);
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
                        requestSource = new AlternativePaymentSource("giropay") { { "bic", "TESTDETT421" }, { "purpose", "CKO Demo Shop unit test" } };
                        currency = Currency.USD;
                        amount = 100;
                        paymentRequest = new PaymentRequest<AlternativePaymentSource>(requestSource, currency, amount);
                        result = await controller.Payments(paymentRequest);
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
                AlternativePaymentSource requestSource;
                PaymentRequest<AlternativePaymentSource> paymentRequest;
                context["that is valid"] = () =>
                {
                    beforeAllAsync = async () =>
                    {
                        requestSource = new AlternativePaymentSource("ideal") { { "issuer_id", "INGBNL2A" } };
                        currency = Currency.EUR;
                        amount = 100;
                        paymentRequest = new PaymentRequest<AlternativePaymentSource>(requestSource, currency, amount);
                        result = await controller.Payments(paymentRequest);
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
                        requestSource = new AlternativePaymentSource("ideal") { };
                        currency = Currency.EUR;
                        amount = 100;
                        paymentRequest = new PaymentRequest<AlternativePaymentSource>(requestSource, currency, amount);
                        result = await controller.Payments(paymentRequest);
                        exception = (result as ObjectResult).Value as Exception;
                    };

                    it["should return 422 - Invalid data was sent"] = () =>
                    {
                        (result as UnprocessableEntityObjectResult).StatusCode.ShouldBe(StatusCodes.Status422UnprocessableEntity);
                    };

                    context["with exception that"] = () =>
                    {
                        it["should be thrown due to error: request_invalid"] = () =>
                        {
                            exception.Message.ShouldContain("request_invalid");
                        };
                    };
                };

                context["that is invalid"] = () =>
                {
                    beforeAllAsync = async () =>
                    {
                        requestSource = new AlternativePaymentSource("ideal") { { "issuer_id", "INGBNL2A" } };
                        currency = Currency.USD;
                        amount = 100;
                        paymentRequest = new PaymentRequest<AlternativePaymentSource>(requestSource, currency, amount);
                        result = await controller.Payments(paymentRequest);
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
                AlternativePaymentSource requestSource;
                PaymentRequest<AlternativePaymentSource> paymentRequest;
                beforeAllAsync = async () =>
                {
                    requestSource = new AlternativePaymentSource("ideal") { { "issuer_id", "INGBNL2A" } };
                    currency = Currency.EUR;
                    amount = 100;
                    paymentRequest = new PaymentRequest<AlternativePaymentSource>(requestSource, currency, amount);
                    result = await controller.Payments(paymentRequest); // POST payments
                    payment = (result as ObjectResult).Value as Resource;
                    result = await controller.Payments((payment as PaymentPending).Id); // GET payments
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
        SourceResponse sourceResponse;
        void when_post_sources()
        {
            context["given a sepa source"] = () =>
            {
                beforeAllAsync = async () =>
                {
                    sourceRequest = new SourceRequest()
                    {
                        Type = "sepa",
                        Reference = "CKO Demo test",
                        BillingAddress = new Address()
                        {
                            AddressLine1 = "Checkout GmbH",
                            AddressLine2 = "Rudi-Dutschke-Straße 26",
                            City = "Berlin",
                            Zip = "10969",
                            State = "Berlin",
                            Country = "DE"
                        },
                        Phone = new Phone()
                        {
                            CountryCode = "+49",
                            Number = "3088789157"
                        },
                        SourceData = new SourceData()
                        {
                            FirstName = "Marcus",
                            LastName = "Barrilius Maximus",
                            Iban = "DE25100100101234567893",
                            Bic = "PBNKDEFFXXX",
                            BillingDescriptor = "CKO Demo test",
                            MandateType = "single"
                        }
                    };
                    result = await controller.Sources(sourceRequest);
                    sourceResponse = (result as ObjectResult).Value as SourceResponse;
                };

                it["should return 201 - Created"] = () =>
                {
                    (result as CreatedAtActionResult).StatusCode.ShouldBe(StatusCodes.Status201Created);
                };

                it["should match request source type with response source type"] = () =>
                {
                    sourceResponse.Type.ToLower().ShouldBe(sourceRequest.Type.ToLower());
                };

                it["should return a mandate reference"] = () =>
                {
                    sourceResponse.ResponseData.MandateReference.ShouldNotBeNullOrEmpty();
                };
            };
        }

        void when_get_hypermedia_actions()
        {
            context["given a valid paymentId"] = () =>
            {
                CardSource requestSource;
                PaymentRequest<CardSource> paymentRequest;
                beforeAllAsync = async () =>
                {
                    requestSource = new CardSource("4242424242424242", 12, 2022);
                    currency = Currency.EUR;
                    amount = 100;
                    paymentRequest = new PaymentRequest<CardSource>(requestSource, currency, amount);
                    result = await controller.Payments(paymentRequest); // POST payments
                    payment = (result as ObjectResult).Value as Resource;
                    result = await controller.Actions((payment as PaymentProcessed).Id);
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
