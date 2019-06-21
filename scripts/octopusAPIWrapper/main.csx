#r "nuget: Octopus.Client, 4.47.0"
#r "nuget: Microsoft.Extensions.Configuration, 2.0.2"
#r "nuget: Microsoft.Extensions.Configuration.FileExtensions, 2.0.2"
#r "nuget: Microsoft.Extensions.Configuration.Json, 2.0.2"
#r "nuget: Microsoft.Extensions.Configuration.Binder, 2.0.2"
#r "nuget: Oakton, 1.5.0"

using Octopus.Client;
using Octopus.Client.Model;
using System;
using System.IO;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.Binder;
using Oakton;

public class OctCommand : OaktonAsyncCommand<RunnerOptions>
{
    public enum Targets
    {
        Internal,
        External,
        Simulator
    }

    private static OctopusClient _octClient;
    private static OctopusRepository _octRepo;
    private static ProjectResource _baseProject;
    private static string _groupId;
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

        _settings.APIKey = options.APIKey;

        try
        {
            Login(_settings.Server, _settings.APIKey);
        }
        catch (System.Net.Http.HttpRequestException)
        {
            NormLogger.Err("HttpRequestException are you connected via VPN?");
            return false;
        }

        _settings.ApplyChanges = options.ApplyFlag;

        RunModeCheck();

        CreateGroup(_settings.GroupName);
        CreateProjects(_settings.Projects);
        CleanUp();

        NormLogger.Info($"All done, bye bye");
        return true;
    }

    /// <summary>
    /// Loops through the projects and creates them
    /// </summary>
    /// <param name="projects">The list of projects to be created</param>
    public void CreateProjects(string[][] projects)
    {
        foreach (string[] project in projects)
        {
            var targetProject = project[0];
            var cloneProject = project[1];

            NormLogger.Info($"Will Create new Project [{targetProject}] based on [{cloneProject}]");

            GetBaseProject(cloneProject);

            if (_baseProject == null)
            {
                NormLogger.Err($"No Base Project [{cloneProject}] found! skipping to next.");
                continue;
            }

            CloneProject(targetProject);
        }
    }

    /// <summary>
    /// Clean up function
    /// </summary>
    public void CleanUp()
    {
        if (!_settings.ApplyChanges)
        {
            DeleteGroup(_groupId);
        }
    }

    /// <summary>
    /// Basic wrapper function for Octopus connection init and authentication
    /// </summary>
    /// <param name="server">The server to connect to</param>
    /// <param name="apiKey">The api key</param>
    public void Login(string server, string apiKey)
    {
        _octClient = new OctopusClient(new OctopusServerEndpoint(server, apiKey));
        _octRepo = new OctopusRepository(_octClient);
        NormLogger.Success("Connected to Octopus.");
    }

    /// <summary>
    /// Creates a new group for the Project
    /// TEST Prefix is added to temp groups which are then removed on cleanup
    /// </summary>
    /// <param name="groupName">The fully qualified name of the group</param>
    public void CreateGroup(string groupName)
    {
        var group = _octRepo.ProjectGroups.FindByName(groupName);

        if (group != null)
        {
            _groupId = group.Id;
            return;
        }

        group = new ProjectGroupResource();
        group.Name = groupName;
        group.Description = "Group for " + groupName;

        if (!_settings.ApplyChanges)
        {
            group.Name = "TEST-" + group.Name;
        }

        group = _octRepo.ProjectGroups.Create(group);

        _groupId = group.Id;
    }

    public static void DeleteGroup(string groupId)
    {
        var group = _octRepo.ProjectGroups.FindOne(x => x.Id == groupId);

        if (group != null)
        {
            _octRepo.ProjectGroups.Delete(group);
        }
    }

    /// <summary>
    /// Retrieves the base project to be used for cloning
    /// </summary>
    /// <param name="baseProjectName">The fully qualified name of the project</param>
    public bool GetBaseProject(string baseProjectName)
    {
        string targetProjectName = baseProjectName;

        _baseProject = _octRepo.Projects.FindByName(targetProjectName);

        return _baseProject != null;
    }


    /// <summary>
    /// Clones an existing project with modifications
    /// </summary>
    /// <param name="fullProjectName">The fully qualified name of the project</param>
    public void CloneProject(string fullProjectName)
    {
        var newProject = _octRepo.Projects.FindByName(fullProjectName);

        if (newProject != null)
        {
            NormLogger.Err($"Project {fullProjectName} already exists!");
            return;
        }

        newProject = new ProjectResource
        {
            Name = fullProjectName,
            Description = "",
            ProjectGroupId = _groupId,
            LifecycleId = _baseProject.LifecycleId
        };

        if (_settings.ApplyChanges)
        {
            _octClient.Post("~/api/projects?clone=" + _baseProject.Id, newProject);
            NormLogger.Info($"Created new project! {newProject.Id}");
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
    public string Server { get; set; }
    public string APIKey { get; set; }
    public string GroupName { get; set; }
    public string[][] Projects { get; set; }
    public bool ApplyChanges { get; set; } = false;
}

public class RunnerOptions
{
    [Description("If set, changes are applied.")]
    public bool ApplyFlag { get; set; } = false;

    [Description("Environment")]
    public string Environment { get; set; } = "Staging";

    [Description("APIKey")]
    public string APIKey { get; set; }
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

    public static void Success(string message)
    {
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine(message);
        ResetColor();
    }

    private static void ResetColor()
    {
        Console.ForegroundColor = ConsoleColor.White;
    }
}


// Args is a global variable injected to pass cmd arguments
return CommandExecutor.ExecuteCommand<OctCommand>(Args.ToArray());