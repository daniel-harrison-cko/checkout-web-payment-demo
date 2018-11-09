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

            context["given ~/lpp_giropay/banks"] = () =>
            {
                beforeAllAsync = async () =>
                {
                    lppId = "lpp_giropay";
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

            context["given ~/lpp_ducks/banks"] = () =>
            {
                beforeAllAsync = async () =>
                {
                    lppId = "lpp_ducks";
                    result = await controller.Banks(lppId);
                };

                it["should return 404 - Not Found"] = () =>
                {
                    (result as NotFoundResult).StatusCode.ShouldBe(StatusCodes.Status404NotFound);
                };
            };
        }
    }
}