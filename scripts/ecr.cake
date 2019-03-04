#addin nuget:?package=AWSSDK.ECR&version=3.3.3.39
#addin nuget:?package=AWSSDK.Core&version=3.3.29.12

using Amazon.ECR;
using Amazon.Runtime;
using Amazon.Runtime.CredentialManagement;
using Amazon.Runtime.AWSCredentials;
using Amazon.ECR.Model;

void LoginToECR()
{
    var credentials = GetEcrLoginCredentials().Result;

    var loginSettings = new ProcessSettings
    {
        Arguments = $"login --username {credentials.Username} --password {credentials.Password} {credentials.Proxy}"
    };

    StartProcess("docker", loginSettings);
}

class EcrLoginCredentials
{
    public string Username { get; set; }
    public string Password { get; set; }
    public string Proxy { get; set; }
}

async Task<EcrLoginCredentials> GetEcrLoginCredentials()
{
    //Most of this code has been taken from / inspired from 
    // https://github.com/aws/aws-extensions-for-dotnet-cli/blob/master/src/Amazon.ECS.Tools/Commands/PushDockerImageCommand.cs#L194

    // More about credentials here
    // https://stackoverflow.com/questions/47124876/how-to-specify-aws-credentials-in-c-sharp-net-core-console-program
    // var credentials = new BasicAWSCredentials(awsAccessKeyId, awsSecretKey);
    // var credentials = new SessionAWSCredentials(awsAccessKeyId, awsSecretKey, awsSessionToken);

    AWSCredentials credentials;
    try
    {
        credentials = new EnvironmentVariablesAWSCredentials();
        
    }
    catch (System.InvalidOperationException)
    {
        Information("Couldn't get AWS credentials from environment. Trying shared credentials file.");
        var sharedCredentialsFile = new SharedCredentialsFile();
        sharedCredentialsFile.TryGetProfile("default", out CredentialProfile defaultProfile);
        credentials = defaultProfile.GetAWSCredentials(sharedCredentialsFile);
    }
    
    var config = new AmazonECRConfig();
    var region = EnvironmentVariable("AWS_REGION") ?? "eu-west-2";
    config.RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(region);
    
    var ecrClient = new AmazonECRClient(credentials, config);
    
    var response = await ecrClient.GetAuthorizationTokenAsync(new GetAuthorizationTokenRequest());

    var authTokenBytes = Convert.FromBase64String(response.AuthorizationData[0].AuthorizationToken);
    var authToken = Encoding.UTF8.GetString(authTokenBytes);
    var decodedTokens = authToken.Split(':');

    return new EcrLoginCredentials() 
    {
        Username = decodedTokens[0],
        Password = decodedTokens[1],
        Proxy = response.AuthorizationData[0].ProxyEndpoint
    };
}