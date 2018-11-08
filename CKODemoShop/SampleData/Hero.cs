using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CKODemoShop.SampleData
{
    public class Hero : IHero
    {
        public string Name { get; set; }
        public string Universe { get; set; }
        public int Rank { get; set; }
        public string ImgSrc { get; set; }
        public string Description { get; set; }
    }
}
