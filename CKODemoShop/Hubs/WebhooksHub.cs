using CKODemoShop.Controllers;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CKODemoShop.Hubs
{
    public class WebhooksHub : Hub<ITypedHubClient> { }
}
