//////////////////////////////////////////////////////////////////////
// TOOLS
//////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////
// ADDINS
//////////////////////////////////////////////////////////////////////
#addin nuget:?package=Cake.Docker&version=0.10.0

#l "scripts/octopus.cake"
#l "scripts/ecr.cake"
#l "scripts/gitversion.cake"

//////////////////////////////////////////////////////////////////////
// NAMESPACES
//////////////////////////////////////////////////////////////////////
using System.Linq;

//////////////////////////////////////////////////////////////////////
// CLASSES
//////////////////////////////////////////////////////////////////////
public class Project
{
    public string OctopusProjectName { get; set; }
    public string EcsLondonImageName { get; set; }
    public string EcsIrelandImageName { get; set; }
    public string DockerImagePath { get; set; }
}

//////////////////////////////////////////////////////////////////////
// ARGUMENTS
//////////////////////////////////////////////////////////////////////
var target = Argument("target", "Default");
var configuration = Argument("configuration", "Release");
var isCIBuild = !BuildSystem.IsLocalBuild;
var ecsRepository = EnvironmentVariable("ECS_REPOSITORY");
var region = EnvironmentVariable("AWS_REGION");
var isProduction = string.Equals(region, "eu-west-1", StringComparison.OrdinalIgnoreCase);


Project[] solution;
GitVersionCustom gitVersionInfo;
string nugetVersion;

Setup(context =>
{
    gitVersionInfo = GetGitVersion();
    nugetVersion = gitVersionInfo.NuGetVersion;

    solution = new []
    {
        new Project
        {
            OctopusProjectName = "Web Payment Demo",
            EcsLondonImageName = $"ckotech/fweb-payment-demo:{nugetVersion}",
            EcsIrelandImageName = $"ckotech/web-payment-demo-prod:{nugetVersion}",
            DockerImagePath = "./CKODemoShop/Dockerfile"
        }
    };

    Information("Building Web Payment Demo v{0} with configuration {1}", nugetVersion, configuration);
});

Task("__BuildAll")
    .Does(() =>
    {
        var buildSettings = new DotNetCoreBuildSettings
        {
            Configuration = configuration
        };

        var solutionFile = GetFiles("*.sln").FirstOrDefault();

        if (solutionFile != null)
        {
            DotNetCoreBuild(solutionFile.GetFilename().ToString(), buildSettings);
        }
        else
        {
            throw new Exception("Solution file not found.");
        }
    });

Task("__Test")
    .IsDependentOn("__UnitTest")
    .IsDependentOn("__IntegrationTest");

Task("__IntegrationTest")
    .Does(() =>
    {        
        var projectFiles = GetFiles("./test/**/*.IntegrationTests.csproj");
        foreach(var projectFile in projectFiles)
        {
            if(isCIBuild)
                DotNetCoreRun(projectFile.FullPath, "--formatter XUnit");
            else
                DotNetCoreRun(projectFile.FullPath);
        }
    });

Task("__UnitTest")
    .Does(() =>
    {        
        var projectFiles = GetFiles("./test/**/*.UnitTests.csproj");
        foreach(var projectFile in projectFiles)
        {
            if(isCIBuild)
                DotNetCoreRun(projectFile.FullPath, "--formatter XUnit");
            else
                DotNetCoreRun(projectFile.FullPath);
        }
    });

Task("__DockerBuild")
    .Does(async () =>
    {
        var aggregate = solution.Select(project =>
            System.Threading.Tasks.Task.Factory.StartNew(() =>
            {
                var imageName = isProduction
                    ? project.EcsIrelandImageName
                    : project.EcsLondonImageName;

                if(System.String.IsNullOrWhiteSpace(imageName))
                {
                    Information($"Skipping building {project.OctopusProjectName}, as it doesn't have configured image name.");
                    return System.Threading.Tasks.Task.CompletedTask;
                }

                var settings = new DockerImageBuildSettings
                {
                    File = project.DockerImagePath,
                    BuildArg = new[] {
                        $"BUILDCONFIG={configuration}",
                        $"VERSION={nugetVersion}"
                    },
                    Tag = new[] {$"{ecsRepository}/{imageName}"}
                };

                DockerBuild(settings, ".");

                return System.Threading.Tasks.Task.CompletedTask;
            }));

        await System.Threading.Tasks.Task.WhenAll(aggregate);
    });

Task("__DockerLogin")
    .Does(() =>
    {
        LoginToECR();
    });

Task("__DockerPush")
    .Does(async () =>
    {
        var aggregate = solution.Select(project =>
            System.Threading.Tasks.Task.Factory.StartNew(() =>
            {
                var imageName = isProduction
                    ? project.EcsIrelandImageName
                    : project.EcsLondonImageName;

                if(System.String.IsNullOrWhiteSpace(imageName))
                {
                    Information($"Skipping pushing {project.OctopusProjectName}, as it doesn't have configured image name.");
                    return System.Threading.Tasks.Task.CompletedTask;
                }

                DockerPush($"{ecsRepository}/{imageName}");
                return System.Threading.Tasks.Task.CompletedTask;
            }));

        await System.Threading.Tasks.Task.WhenAll(aggregate);
    });

Task("__OctoCreateRelease")
    .Does(async ctx =>
    {
        string channel = null;

        if (!isProduction)
        { 
            var branch = gitVersionInfo.BranchName;
            if (branch ==  "develop")
            {
                channel = "Dev";
            } 
            else if (branch == "master" || branch.StartsWith("release"))
            {
                channel = "QA";
            }
            else 
            {
                throw new InvalidOperationException($"Unexpected branch name: {branch}");
            }
            
            Information($"Creating Release in Channel {channel}");
         }

        var server = EnvironmentVariable("OCTOPUS_SERVER");
        var apiKey = EnvironmentVariable("OCTOPUS_APIKEY");            
        var aggregate = solution
            .Select(project => 
            {
                var imageName = isProduction
                    ? project.EcsIrelandImageName
                    : project.EcsLondonImageName;

                if(System.String.IsNullOrWhiteSpace(imageName))
                {
                    Information($"Skipping release {project.OctopusProjectName}, as it doesn't have configured image name.");
                    return System.Threading.Tasks.Task.CompletedTask;
                }
               return Octo.CreateRelease(ctx, server, apiKey, project.OctopusProjectName, nugetVersion, channel);
            }
            );

        await System.Threading.Tasks.Task.WhenAll(aggregate);
    });


Task("__DockerComposeUp")
    .Does(() =>
    {
        var settings = new DockerComposeUpSettings
        {
            Build = true,
            DetachedMode = true,
            Files = new[] { "docker-compose.yml" }
        };

        DockerComposeUp(settings);
    });

Task("__DockerComposeDown")
    .Does(() =>
    {
        var settings = new DockerComposeDownSettings
        {
            Files = new[] { "docker-compose.yml" },
            Volumes = true
        };

        DockerComposeDown(settings);
    });

Task("Build")
    .IsDependentOn("__BuildAll")
    .IsDependentOn("__UnitTest");

Task("IntegrationTest")
    .IsDependentOn("__BuildAll")
    .IsDependentOn("__IntegrationTest");

Task("Test")
    .IsDependentOn("Build")
    .IsDependentOn("__DockerComposeUp")
    .IsDependentOn("__IntegrationTest")
    .IsDependentOn("__DockerComposeDown");

Task("Deploy")
    .IsDependentOn("Build")
    .IsDependentOn("__DockerBuild")
    .IsDependentOn("__DockerLogin")
    .IsDependentOn("__DockerPush")
    .IsDependentOn("__OctoCreateRelease");

Task("Default")
    .IsDependentOn("Build");


Task("__TestLoginToECR")
    .Does(() => {
        LoginToECR();
    });

RunTarget(target);