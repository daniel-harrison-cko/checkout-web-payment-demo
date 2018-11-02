using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;

namespace CKODemoShop.Controllers
{
    [Route("api/[controller]")]
    public class SampleDataController : Controller
    {
        private static Hero[] Heroes = new[]
        {
            new Hero()
            {
                Name = "Batman",
                Universe = "DC",
                Rank = 1,
                ImgSrc = "https://upload.wikimedia.org/wikipedia/en/8/87/Batman_DC_Comics.png",
                Description = "Millionaire Bruce Wayne was just a kid when he watched his parents get gunned down during a mugging in Gotham City. The crime would define his life, as he dedicated himself to becoming the world’s greatest weapon against crime—the Batman."
            },
            new Hero()
            {
                Name = "Thor",
                Universe = "Marvel",
                Rank = 2,
                ImgSrc = "https://www.writeups.org/wp-content/uploads/Thor-Marvel-Comics-Odinson-Profile-e.jpg",
                Description = "Thor, the God of Thunder, the son of Odin, the Asgardian prince, wields the mystical mallet Mjolnir as he protects innocents across the realms on his own and as a member of the Avengers. He takes his name from the inscription on his famous weapon."
            },
            new Hero()
            {
                Name = "Spider-Man",
                Universe = "Marvel",
                Rank = 3,
                ImgSrc = "https://upload.wikimedia.org/wikipedia/en/2/21/Web_of_Spider-Man_Vol_1_129-1.png",
                Description = "Bitten by a radioactive spider, Peter Parker’s arachnid abilities give him amazing powers he uses to help others, even while his personal life continues to offer plenty of obstacles."
            },
            new Hero()
            {
                Name = "Superman",
                Universe = "DC",
                Rank = 4,
                ImgSrc = "https://static.comicvine.com/uploads/scale_small/13/132327/6507037-28872490_1638064799604695_1250122498385004714_n.jpg",
                Description = "Rocketed to Earth from the dying planet Krypton, baby Kal-El was found by a farming couple who named the boy Clark Kent and raised him as their own. Discovering his enormous powers, they instilled in him strong moral values—and inspired him to become a hero."
            },
            new Hero()
            {
                Name = "Iron Man",
                Universe = "Marvel",
                Rank = 5,
                ImgSrc = "https://upload.wikimedia.org/wikipedia/en/e/e0/Iron_Man_bleeding_edge.jpg",
                Description = "Genius. Billionaire. Playboy. Philanthropist. Tony Stark’s confidence is only matched by his high - flying abilities as the hero called Iron Man."
            },
            new Hero()
            {
                Name = "Wonder Woman",
                Universe = "DC",
                Rank = 6,
                ImgSrc = "https://orig00.deviantart.net/f02d/f/2016/149/b/d/wonder_woman_comic_png_render_by_mrvideo_vidman-da47a14.png",
                Description = "Wonder Woman is Princess Diana of the immortal Amazons from Greek mythology. Helping her are her superhuman strength and speed, as well as the trademark bulletproof bracelets, but it’s probably her Golden Lasso of Truth most people really wish they had."
            },
            new Hero()
            {
                Name = "Wolverine",
                Universe = "Marvel",
                Rank = 7,
                ImgSrc = "https://upload.wikimedia.org/wikipedia/en/c/c8/Marvelwolverine.jpg",
                Description = "A mutant with an unstoppable healing power, adamantium metal claws and no-nonsense attitude makes the man called Logan, one of the most ferocious heroes in the universe."
            },
            new Hero()
            {
                Name = "Captain America",
                Universe = "Marvel",
                Rank = 8,
                ImgSrc = "https://upload.wikimedia.org/wikipedia/en/8/83/Captain_America_%28Steve_Rogers%29_All_New_All_Different_Marvel_version.jpg",
                Description = "Recipient of the Super-Soldier serum, World War II hero Steve Rogers fights for American ideals as one of the world’s mightiest heroes and the leader of the Avengers."
            },
            new Hero()
            {
                Name = "The Flash",
                Universe = "DC",
                Rank = 9,
                ImgSrc = "https://www.writeups.org/wp-content/uploads/Flash-DC-Comics-Wally-West.jpg",
                Description = "Young Barry Allen’s life stopped the minute his mother was murdered. The true killer never found, its mystery obsessed Barry, driving him to become a forensic scientist. Consumed by his work, he spent his life chained to his desk, solving every case that flew across it. But when a freak lightning bolt hits a nearby shelf in his lab, Barry receives super-speed, becoming the Flash."
            },
            new Hero()
            {
                Name = "Green Lantern",
                Universe = "DC",
                Rank = 10,
                ImgSrc = "https://upload.wikimedia.org/wikipedia/en/6/69/Greenlantern.PNG",
                Description = "Mastering that power and being a Green Lantern means facing your fears, and for headstrong Hal Jordan, that’s something he’s been avoiding his whole life. When a dying alien crashes on Earth, the irresponsible Hal is chosen to be that alien’s successor in the Green Lantern Corps, a universe-wide peacekeeping force over 3,600 members strong."
            }
        };

        [HttpGet("[action]/{name}")]
        [ProducesResponseType(200, Type = typeof(IHero))]
        [ProducesResponseType(404)]
        public IActionResult GetHero(string name)
        {
            if(!Heroes.Any(hero => hero.Name.ToLower() == name))
            {
                return NotFound();
            }
            else
            {
                return Ok(Heroes.Where(hero => hero.Name.ToLower() == name).Single());
            }
        }

        [HttpGet("[action]")]
        [ProducesResponseType(200, Type = typeof(IHero[]))]
        [ProducesResponseType(400)]
        public IActionResult GetAllHeroes()
        {
            try
            {
                return Ok(Heroes);
            }
            catch(Exception e)
            {
                return BadRequest();
            }
        }

        public class Hero : IHero
        {
            public string Name { get; set; }
            public string Universe { get; set; }
            public int Rank { get; set; }
            public string ImgSrc { get; set; }
            public string Description { get; set; }
        }

        public interface IHero
        {
            string Name { get; set; }
            string Universe { get; set; }
            int Rank { get; set; }
            string ImgSrc { get; set; }
            string Description { get; set; }
        }
    }
}
