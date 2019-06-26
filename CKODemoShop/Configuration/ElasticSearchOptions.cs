using System;

namespace CKODemoShop.Configuration
{
    public class ElasticSearchOptions
    {
        public Uri Node { get; set; }
        public bool AutoRegisterTemplate { get; set; }
        public string IndexFormat { get; set; }
    }
} 