import { Component } from '@angular/core';
import { Hero } from '../../classes/hero';

const HEROES: Hero[] = <Hero[]>[
  {
    name: 'Batman',
    universe: 'DC',
    rank: 1,
    imgSrc: 'https://upload.wikimedia.org/wikipedia/en/8/87/Batman_DC_Comics.png',
    description: 'Millionaire Bruce Wayne was just a kid when he watched his parents get gunned down during a mugging in Gotham City. The crime would define his life, as he dedicated himself to becoming the world’s greatest weapon against crime—the Batman.'
  },
  {
    name: 'Thor',
    universe: 'Marvel',
    rank: 2,
    imgSrc: 'https://www.writeups.org/wp-content/uploads/Thor-Marvel-Comics-Odinson-Profile-e.jpg',
    description: 'Thor, the God of Thunder, the son of Odin, the Asgardian prince, wields the mystical mallet Mjolnir as he protects innocents across the realms on his own and as a member of the Avengers. He takes his name from the inscription on his famous weapon.'
  },
  {
    name: 'Spider-Man',
    universe: 'Marvel',
    rank: 3,
    imgSrc: 'https://upload.wikimedia.org/wikipedia/en/2/21/Web_of_Spider-Man_Vol_1_129-1.png',
    description: 'Bitten by a radioactive spider, Peter Parker’s arachnid abilities give him amazing powers he uses to help others, even while his personal life continues to offer plenty of obstacles.'
  },
  {
    name: 'Superman',
    universe: 'DC',
    rank: 4,
    imgSrc: 'https://static.comicvine.com/uploads/scale_small/13/132327/6507037-28872490_1638064799604695_1250122498385004714_n.jpg',
    description: 'Rocketed to Earth from the dying planet Krypton, baby Kal-El was found by a farming couple who named the boy Clark Kent and raised him as their own. Discovering his enormous powers, they instilled in him strong moral values—and inspired him to become a hero.'
  },
  {
    name: 'Iron Man',
    universe: 'Marvel',
    rank: 5,
    imgSrc: 'https://upload.wikimedia.org/wikipedia/en/e/e0/Iron_Man_bleeding_edge.jpg',
    description: 'Genius. Billionaire. Playboy. Philanthropist. Tony Stark’s confidence is only matched by his high - flying abilities as the hero called Iron Man.'
  },
  {
    name: 'Wonder Woman',
    universe: 'DC',
    rank: 6,
    imgSrc: 'https://orig00.deviantart.net/f02d/f/2016/149/b/d/wonder_woman_comic_png_render_by_mrvideo_vidman-da47a14.png',
    description: 'Wonder Woman is Princess Diana of the immortal Amazons from Greek mythology. Helping her are her superhuman strength and speed, as well as the trademark bulletproof bracelets, but it’s probably her Golden Lasso of Truth most people really wish they had.'
  },
  {
    name: 'Wolverine',
    universe: 'Marvel',
    rank: 7,
    imgSrc: 'https://upload.wikimedia.org/wikipedia/en/c/c8/Marvelwolverine.jpg',
    description: 'A mutant with an unstoppable healing power, adamantium metal claws and no-nonsense attitude makes the man called Logan, one of the most ferocious heroes in the universe.'
  },
  {
    name: 'Captain America',
    universe: 'Marvel',
    rank: 8,
    imgSrc: 'https://upload.wikimedia.org/wikipedia/en/8/83/Captain_America_%28Steve_Rogers%29_All_New_All_Different_Marvel_version.jpg',
    description: 'Recipient of the Super-Soldier serum, World War II hero Steve Rogers fights for American ideals as one of the world’s mightiest heroes and the leader of the Avengers.'
  },
  {
    name: 'The Flash',
    universe: 'DC',
    rank: 9,
    imgSrc: 'https://www.writeups.org/wp-content/uploads/Flash-DC-Comics-Wally-West.jpg',
    description: 'Young Barry Allen’s life stopped the minute his mother was murdered. The true killer never found, its mystery obsessed Barry, driving him to become a forensic scientist. Consumed by his work, he spent his life chained to his desk, solving every case that flew across it. But when a freak lightning bolt hits a nearby shelf in his lab, Barry receives super-speed, becoming the Flash.'
  },
  {
    name: 'Green Lantern',
    universe: 'DC',
    rank: 10,
    imgSrc: 'https://upload.wikimedia.org/wikipedia/en/6/69/Greenlantern.PNG',
    description: 'Mastering that power and being a Green Lantern means facing your fears, and for headstrong Hal Jordan, that’s something he’s been avoiding his whole life. When a dying alien crashes on Earth, the irresponsible Hal is chosen to be that alien’s successor in the Green Lantern Corps, a universe-wide peacekeeping force over 3,600 members strong.'
  }
]

@Component({
  selector: 'heroes',
  templateUrl: './heroes.component.html'
})
export class HeroesComponent {
  private heroes: Hero[] = HEROES;
}
