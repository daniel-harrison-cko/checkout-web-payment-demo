#r "nuget: Seq.Api, 5.0.0"
#r "nuget: Microsoft.Extensions.Configuration, 2.0.2"
#r "nuget: Microsoft.Extensions.Configuration.FileExtensions, 2.0.2"
#r "nuget: Microsoft.Extensions.Configuration.Json, 2.0.2"
#r "nuget: Microsoft.Extensions.Configuration.Binder, 2.0.2"
#r "nuget: Oakton, 1.5.0"
 
using Seq.Api;
using Seq.Api.Client;
using Seq.Api.Model.Inputs;
using Seq.Api.Model.Signals;
using System;
using System.IO;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.Binder;
using Oakton;

public class SeqCommand : OaktonAsyncCommand<RunnerOptions>
{
    private static SeqConnection _seqConnection;
    private static ProgramSettings _settings;

    /// <summary>
    /// Main script process entry method.
    /// </summary>
    /// <param name="RunnerOptions">command line arguments parsed and passed by Oakton</param>
    public override async Task<bool> Execute(RunnerOptions options)
    {
         IConfiguration config = new ConfigurationBuilder()
          .SetBasePath(Directory.GetCurrentDirectory())
          .AddJsonFile($"appsettings.json", true, true)
          .AddJsonFile($"appsettings.{options.Environment}.json", true, true)
          .Build();

        _settings = new ProgramSettings();
        config.Bind(_settings);
        
        try
        {
            await Login(_settings.Username, options.Password);
        }
        catch (SeqApiException)
        {
            NormLogger.Err("Invalid Password.");
            return false;
        }
        catch (System.Net.Http.HttpRequestException)
        {
            NormLogger.Err("HttpRequestException are you connected via VPN?");
            return false;
        }
        
        _settings.ApplyChanges = options.ApplyFlag;
        RunModeCheck();
        
        //First iterate over service type, then over environment
        //(corresponds to octopus dialogues)
        foreach (var service in _settings.Services)
        {
            foreach (var env in _settings.Env)    
            {
                string apiKeyName = $"{env.Key}-{service.ApiKeyPostfix}";

                await CreateApiKey(apiKeyName, env.Key);
            }
        }

        foreach (var service in _settings.Services)
        {
            NormLogger.Info($"Attempting to create signal for [{service.SignalName}]");
            await CreateSignal(service.SignalName, _settings.ExplicitGroupName, service);
        }
        
        NormLogger.Info($"All done, bye bye");
        return true;
    }

    /// <summary>
    /// Basic wrapper function for SEQ connection init and authentication
    /// </summary>
    /// <param name="username">The account username</param>
    /// <param name="password">The account password</param>
    public async Task Login(string username, string password)
    {
        _seqConnection = new SeqConnection(_settings.SeqConnectionString);
        await _seqConnection.Users.LoginAsync(username, password);
    }

    /// <summary>
    /// Create signal wrapper including group name
    /// </summary>
    /// <param name="signalName">The name of the to-be-created signal</param>
    /// <param name="service">Information about the service for which the signal is created</param>
    public async Task CreateSignal(string signalName, string explicitGroupName, Service service)
    {
        SignalEntity signal = await _seqConnection.Signals.TemplateAsync();
        signal.Title = signalName;
        signal.Grouping = SignalGrouping.Explicit;    
        signal.ExplicitGroupName = explicitGroupName;

        var filterPart = new SignalFilterPart
            {
                Filter = service.Filter
            };
        signal.Filters.Add(filterPart);

        NormLogger.Info($"Attempting to create signal with filter [{filterPart.Filter}]");

        if (_settings.ApplyChanges)
        {
            await _seqConnection.Signals.AddAsync(signal);
        }
    }

    /// <summary>
    /// Delete signal wrapper. Caution, delete signal required the ID not the string name
    /// </summary>
    /// <param name="signalID">The id of the to-be-deleted signal</param>
    public async Task DeleteSignal(string signalID)
    {
        SignalEntity signal = await _seqConnection.Signals.FindAsync($"signal-{signalID}");
        await _seqConnection.Signals.RemoveAsync(signal);
    }

    /// <summary>
    /// Create API Key wrapper.
    /// </summary>
    /// <param name="keyName">The name of the to-be-created key</param>
    /// <param name="env">The environment of the to-be-created key</param>
    public async Task CreateApiKey(string keyName, string env)
    {
        ApiKeyEntity templateKey = await _seqConnection.ApiKeys.TemplateAsync();

        templateKey.Title = keyName;

        InputAppliedPropertyPart _property = new InputAppliedPropertyPart();
        _property.Name = "Environment";
        _property.Value = _settings.Env.GetValueOrDefault(env);
        templateKey.AppliedProperties.Add(_property);
        
        NormLogger.Info($"Attempting to create key for [{keyName}] with environment {_property.Value}");
        if (_settings.ApplyChanges)
        {
            var apiKey = await _seqConnection.ApiKeys.AddAsync(templateKey);
            NormLogger.Info($"{keyName}: {apiKey.Token}");
        }
    }

    /// <summary>
    /// Notifies the user via console output about the status of the dryrun functionality.
    /// </summary>
    public void RunModeCheck()
    {
        if (!_settings.ApplyChanges)
        {
            NormLogger.Info("This is a dry run!   Add argument '-- apply' after command call to persist.");
        }
        else
        {
            NormLogger.Warn("Running on apply changes mode. Changes will be persisted!");
        }
    }
}

/// <summary>
/// Model for application settings binding
/// </summary>
public class ProgramSettings
{
    public string Username { get; set; }
    public Dictionary<string, string> Env { get; set; }
    public List<Service> Services { get; set; }
    public string SeqConnectionString { get; set; }
    public string ExplicitGroupName { get; set; }
    public bool ApplyChanges { get; set; } = false;
}

public class Service 
{
    public string ApiKeyPostfix { get; set; }
    public string SignalName { get; set; }
    public string Filter { get; set; }
}

public class RunnerOptions
{
    [Description("If set, changes are applied.")]
    public bool ApplyFlag { get; set; } = false;

    [Description("Environment")]
    public string Environment { get; set; } = "Staging";
    
    [Description("Password")]
    public string Password { get; set; }
}

/// <summary>
/// Small console output wrapper with colored output
/// </summary>
public static class NormLogger
{
    public static void Input(string message)
    {
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine(message);
        ResetColor();
    }

    public static void Info(string message)
    {
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine(message);
        ResetColor();
    }

    public static void Warn(string message)
    {
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine(message);
        ResetColor();
    }

    public static void Err(string message)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine(message);
        ResetColor();
    }

    private static void ResetColor()
    {
        Console.ForegroundColor = ConsoleColor.White;
    }
}


// Args is a global variable injected to pass cmd arguments
return CommandExecutor.ExecuteCommand<SeqCommand>(Args.ToArray());