
//////////////////////////////////////////////////////////////////////
// Octopus helper. Create release using Octopus.Client
//////////////////////////////////////////////////////////////////////

#addin nuget:?package=Octopus.Client&version=4.39.1

using Octopus.Client;
using Octopus.Client.Model;

public class Octo
{
    public static async Task CreateRelease(ICakeContext context, string server, string apiKey, string project, string version, string channel)
    {
        var endpoint = new OctopusServerEndpoint(
                server,
                apiKey
            );
        var client = await OctopusAsyncClient.Create(endpoint);
        var repository = new OctopusAsyncRepository(client);

        var proj = await repository.Projects.FindOne(x => x.Name == project);
        if(proj == null)
        {
            throw new Exception($"Could not find Octopus project {project}");
        }
        var ch = string.IsNullOrEmpty(channel) ? null : await repository.Channels.FindByName(proj, channel);

        var release = new ReleaseResource(
            version,
            proj.Id,
            ch?.Id
        );
        
        var newRelease = await repository.Releases.Create(release);
    }
}