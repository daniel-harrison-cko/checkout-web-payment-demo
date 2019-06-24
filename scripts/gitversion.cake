#tool "nuget:?package=GitVersion.CommandLine.DotNetCore&version=4.0.0"
#addin nuget:?package=Newtonsoft.Json&version=9.0.1

using Newtonsoft.Json;

public class GitVersionCustom
{
    public string NuGetVersion { get; set; }
    public string PreReleaseLabel { get; set; } 
    public string BranchName { get; set; } 
}

public GitVersionCustom GetGitVersion()
{
    //We don't use the build-in GitVersion() currently since it doesn't support
    //.NET Core version of  GitVersion. Instead, we invoke GitVersion manually here

    string gitVersionTool = Context.Tools.Resolve("GitVersion.dll").ToString();
    var gitVersionSettings = new ProcessSettings
        {
            Arguments = gitVersionTool,
            RedirectStandardOutput = true
        };

    using(var process = StartAndReturnProcess("dotnet", gitVersionSettings))
    {
        string gitVersionJson = string.Join("", process.GetStandardOutput());
        process.WaitForExit();
        return JsonConvert.DeserializeObject<GitVersionCustom>(gitVersionJson);
    }
}