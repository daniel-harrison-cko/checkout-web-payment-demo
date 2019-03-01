using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using App.Metrics.Health;
using App.Metrics.Health.Formatters.Json;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Net.Http;
using Checkout;
using CKODemoShop.Checkout;

namespace CKODemoShop
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services
                .AddMvcCore()
                .AddJsonFormatters(serializerOptions =>
                {
                    serializerOptions.NullValueHandling = NullValueHandling.Ignore;
                    serializerOptions.ContractResolver = new DefaultContractResolver()
                    {
                        NamingStrategy = new SnakeCaseNamingStrategy()
                    };
                })
                .SetCompatibilityVersion(CompatibilityVersion.Version_2_1);
            ConfigureHealthChecks(services);

            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/dist/ClientApp";
            });

            services.AddTransient<HttpClient>(provider => provider.GetService<System.Net.Http.IHttpClientFactory>().CreateClient());
            services.AddSingleton<CheckoutApi>(_ => CheckoutApiFactory.ConfiguredFromEnvironment());

        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if(env.IsProduction())
            {
                app.UsePathBase("/demoshop-external");
            }
            
            app.UseHealthEndpoint();
            app.UsePingEndpoint();
            
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller}/{action=Index}/{id?}");
            });

            app.UseSpa(spa =>
            {
                // To learn more about options for serving an Angular SPA from ASP.NET Core,
                // see https://go.microsoft.com/fwlink/?linkid=864501

                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    spa.UseAngularCliServer(npmScript: "start");
                }
            });
        }

        private void ConfigureHealthChecks(IServiceCollection services)
        {
            var metrics = AppMetricsHealth.CreateDefaultBuilder()
            //TODO .HealthChecks.AddCheck<>()
            .BuildAndAddTo(services);

            services.AddHealthEndpoints(options =>
            {
                options.HealthEndpointEnabled = true;
                options.PingEndpointEnabled = true;
                options.HealthEndpointOutputFormatter = new HealthStatusJsonOutputFormatter();
            });
        }
    }
}
