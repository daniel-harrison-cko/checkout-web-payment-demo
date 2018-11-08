using Moq;
using NSpec;
using Shouldly;
using CKODemoShop.Controllers;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using CKODemoShop.SampleData;
using Microsoft.AspNetCore.Http;
using System;

namespace CKODemoShop.Tests
{
    [Tag("sampledata")]
    public class describe_sampledata_controller : nspec
    {
        SampleDataController controller;
        IActionResult result;

        void before_all()
        {
            controller = new SampleDataController();
        }

        string heroName;
        IHero hero;
        void when_get_hero()
        {
            context["given ~/hero/batman"] = () =>
            {
                beforeAsync = async () =>
                {
                    heroName = "batman";
                    result = await controller.Hero(heroName);
                    hero = (result as ObjectResult).Value as IHero;
                };

                it["should return 200 - OK"] = () =>
                {
                    (result as OkObjectResult).StatusCode.ShouldBe(StatusCodes.Status200OK);
                };

                it["should return a hero"] = () =>
                {
                    hero.ShouldNotBeNull();
                };

                it["should return the correct hero"] = () =>
                {
                    hero.Name.ToLower().ShouldBe(heroName);
                };
            };

            context["given ~/hero/invisible-man"] = () =>
            {
                beforeAsync = async () =>
                {
                    heroName = "invisible-man";
                    result = await controller.Hero(heroName);
                };

                it["should return 404 - Not Found"] = () =>
                {
                    (result as NotFoundResult).StatusCode.ShouldBe(StatusCodes.Status404NotFound);
                };
            };

            context["given ~/hero/trump"] = () =>
            {
                beforeAsync = async () =>
                {
                    heroName = "trump";
                    result = await controller.Hero(heroName);
                };

                it["should return 400 - Bad Request"] = () =>
                {
                    (result as BadRequestObjectResult).StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
                    Console.WriteLine((result as BadRequestObjectResult).Value.ToString());
                };
            };
        }

        IHero[] heroes;
        void when_get_heroes()
        {
            context["given ~/heroes"] = () =>
            {
                beforeAsync = async () =>
                {
                    result = await controller.Heroes();
                    heroes = (result as ObjectResult).Value as IHero[];
                };

                it["should return 200 - OK"] = () =>
                {
                    (result as OkObjectResult).StatusCode.ShouldBe(StatusCodes.Status200OK);
                };

                it["should have the length of the HEROES mock"] = () =>
                {
                    heroes.Count().ShouldBe(controller.HEROES.Count());
                };
            };
        }
    }
}