using Checkout.Common;
using System.Collections.Generic;

namespace CKODemoShop.Checkout
{
    public class IssuersResponse : Resource
    {
        public IList<IssuingCountry> Countries { get; set; }
    }
}
