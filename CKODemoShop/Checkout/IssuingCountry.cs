using System.Collections.Generic;

namespace CKODemoShop.Checkout
{
    public class IssuingCountry
    {
        public string Name { get; set; }
        public IList<IssuingBank> Issuers { get; set; }
    }
}
