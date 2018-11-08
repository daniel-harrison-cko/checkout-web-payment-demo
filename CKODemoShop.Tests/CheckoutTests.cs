using Moq;
using NSpec;
using Shouldly;
using CKODemoShop.Controllers;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using CKODemoShop.Checkout;
using Microsoft.AspNetCore.Http;

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
        }

        string lppId;
        List<IIBank> legacyBanks;
        IDictionary<string, string> banks;
        void when_get_banks()
        {
            context["given ~/lpp_19/banks"] = () =>
            {
                beforeAsync = async () =>
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
                beforeAsync = async () =>
                {
                    lppId = "lpp_giropay";
                    result = await controller.Banks(lppId);
                    banks = (result as ObjectResult).Value as IDictionary<string, string>;
                };

                it["should return 200 - OK"] = () =>
                {
                    (result as OkObjectResult).StatusCode.ShouldBe(StatusCodes.Status200OK);
                };

                it["should return a non-empty list of banks"] = () =>
                {
                    banks.ShouldNotBeEmpty();
                };

                it["should contain single bank with KeyValuePair 'BYLADEM1001': 'Deutsche Kreditbank Berlin'"] = () =>
                {
                    banks.Single(bank => (bank.Key == "BYLADEM1001" && bank.Value == "Deutsche Kreditbank Berlin"));
                };
            };

            context["given ~/lpp_ducks/banks"] = () =>
            {
                beforeAsync = async () =>
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