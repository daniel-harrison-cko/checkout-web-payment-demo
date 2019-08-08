using System;
using System.Net;
using Serilog;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using CKODemoShop.Configuration;
using CKODemoShop.Helpers;
using Serilog.Sinks.Elasticsearch;

namespace CKODemoShop.Extensions
{
    public static class LoggingExtensions
    {
        public static IWebHostBuilder UseCkoSerilog<T>(this IWebHostBuilder builder)
        {
            //A note about logging:
            //ILogger<Startup> lives in Microsoft.Extensions.Logging
            //Whereas Log.Logger lives in Serilog.ILogger
            //Hence also the reason for the AddSingleton(Log.Logger) in ConfigureServices.
            //However, both log to the same Serilog sinks as configured in Program.cs

            var elasticSearchOptions = new ElasticSearchOptions();
            
            //This is the preferred way of configuring Serilog. Try not to do in in Startup, this has
            //some disadvantages: https://github.com/serilog/serilog-aspnetcore
            //UseSerilog configures DI and sets Log.Logger
            builder.UseSerilog((hostingContext, loggerConfiguration) => {
                hostingContext.Configuration.GetSection("ElasticSearch").Bind(elasticSearchOptions);

                loggerConfiguration.ConfigureCkoLogger<T>(hostingContext.Configuration, hostingContext.HostingEnvironment.EnvironmentName, elasticSearchOptions);
            });

            //Despite .UseSerilog() we still need to inject Serilog.ILogger
            //Some of our classes depend on Serilog.ILogger
            //Others on Microsoft.Extensions.Logging.ILogger
            builder.ConfigureServices(collection => 
                collection.AddSingleton<ILogger>(Log.Logger)
            );

            return builder;
        }

        public static LoggerConfiguration ConfigureCkoLogger<T>(this LoggerConfiguration loggerConfiguration, IConfiguration configuration, string envName, ElasticSearchOptions elasticSearchOptions)
        {
            loggerConfiguration
                .ReadFrom.Configuration(configuration)
                .Enrich.WithProperty("HostName", GetHostName())
                .Enrich.WithProperty("Version", ReflectionUtils.GetAssemblyVersion<T>())
                .Enrich.WithProperty("Environment", envName)
                .WriteTo.Elasticsearch(
                    new ElasticsearchSinkOptions(elasticSearchOptions.Node)
                    {
                        AutoRegisterTemplate = elasticSearchOptions.AutoRegisterTemplate,
                        IndexFormat = elasticSearchOptions.IndexFormat,
                        MinimumLogEventLevel = Serilog.Events.LogEventLevel.Information
                    });

            return loggerConfiguration;
        }

        private static string GetHostName()
        {
            var hostName = string.Empty;

            try
            {
                hostName = Dns.GetHostName();
            }
            catch (Exception) { }

            return hostName;
        }
    }
}