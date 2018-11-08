using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CKODemoShop.SampleData
{
    public interface IHero
    {
        string Name { get; set; }
        string Universe { get; set; }
        int Rank { get; set; }
        string ImgSrc { get; set; }
        string Description { get; set; }
    }
}
