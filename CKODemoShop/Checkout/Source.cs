using Checkout.Payments;
using System.Collections.Generic;

namespace CKODemoShop.Checkout
{
    public class Source : Dictionary<string, object>, IRequestSource
    {
        public string Type { get; }
    }
}
