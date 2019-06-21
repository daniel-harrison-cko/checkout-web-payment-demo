# Seq API Wrapper v2.0.0

The aim of this script is to automate the creation of Octopus Elements related to a new service.
These include `Groups` and `Projects`

## Running

### Prerequisites
In order to run the OctopusAPIWrapper script you need to install dotnet script first using the following:
`dotnet tool install -g dotnet-script`

*it is required to have .Net Core 2.1*

### Appsettings

```
    // The name of the octopus server
    "Server": "http://cd.ckotech.co",
    // The Api Key of the octopus server
    "APIKey": "API-",
    // The name to be used for the group
    "GroupName": "WebPaymentDemo",
    // The name to be used from the Project
    "ProjectName": "Web Payment Demo",
    // The project that wil be cloned from
    "BaseProjectName": "Fawry",
    // The targets that should be created, ie project for external
    "Targets" : [
        "External"     
    ]
```


### Execution

To run the script execute `dotnet script [file path] -- <environment> <password>`

Where environment points towards a specific `appsettings.{environment}.json` file.

For example.
```bash
dotnet script .\main.csx Production API-XXXXXXXXXXXXXXXXXXXXXXXXXX 
```
### DryRun

By default the process runs on a dry-run mode as cleaning up afterwards, in case of an accident can be quite messy.

**!CAUTION!**
Groups are created even without the apply flag, as we would not be able to continue the flow.
They do however get the `TEST` Prefix.

To run in apply mode add the parameter `--apply` after `--`.
i.e `dotnet script [file path] -- --apply`

dotnet script uses the double dash to separate self arguments and process arguments.

### Debuging

If you need to debug the process you can attach a debugger via VS Code.

If you want debug output add `-d` after the cmd

## Technology
OctopusAPIWrapper uses [dotnet script](https://github.com/filipw/dotnet-script)

