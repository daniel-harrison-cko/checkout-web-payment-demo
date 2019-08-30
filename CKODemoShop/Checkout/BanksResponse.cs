using Checkout.Common;
using System.Collections.Generic;

namespace CKODemoShop.Checkout
{
    public class BanksResponse : Resource
    {
        public IDictionary<string, string> Banks { get; set; }
        public bool HasBanks { get { return Banks.Count > 0; } }
    }
}
