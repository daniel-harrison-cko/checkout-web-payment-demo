using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CKODemoShop.Extensions;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CKODemoShop
{
    public class Program
    {
        public static void Main(string[] args)
        {
            //Dumping environment variables
            Console.WriteLine("GetEnvironmentVariables: ");
            foreach (dynamic de in Environment.GetEnvironmentVariables())
                Console.WriteLine("  {0} = {1}", de.Key, de.Value);
            CreateWebHostBuilder(args).Build().Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseCkoSerilog<Program>()
                .UseStartup<Startup>()
                .ConfigureAppHealthHostingConfiguration(options =>
                 {
                     options.HealthEndpoint = "/_system/health";
                     options.PingEndpoint = "/_system/ping";
                 });
    }
}
