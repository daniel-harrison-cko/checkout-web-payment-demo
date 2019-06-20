# Seq API Wrapper v2.0.0

The aim of this script is to automate the creation of SEQ Elements related to a new service.
These include `ApiKeys` and `Signals`

## Running

### Prerequisites
In order to run the SeqAPIWrapper script you need to install dotnet script first using the following:
`dotnet tool install -g dotnet-script`

*it is required to have .Net Core 2.1*
### Execution

To run the script execute `dotnet script [file path] -- <environment> <password>`

Where environment points towards a specific `appsettings.{environment}.json` file.

For example.
```bash
dotnet-script main.csx -- Staging $(/usr/bin/security find-generic-password -a admin -ws "SEQ London" ~/Library/Keychains/CKO-Admin.keychain-db)
dotnet-script main.csx -- Production $(/usr/bin/security find-generic-password -a admin -ws "SEQ Ireland" ~/Library/Keychains/CKO-Admin.keychain-db)
```
### DryRun

By default the process runs on a dry-run mode as cleaning up afterwards, in case of an accident can be quite messy.

To run in apply mode add the parameter `--apply` after `--`.
i.e `dotnet script [file path] -- --apply`

dotnet script uses the double dash to separate self arguments and process arguments.

### Debuging

If you need to debug the process you can attach a debugger via VS Code.

If you want debug output add `-d` after the cmd

## Technology
SeqAPIWrapper uses [dotnet script](https://github.com/filipw/dotnet-script) as we had issues using cake with the SEQ Library.

