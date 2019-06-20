## SEQ API Wrapper

### Pre-requisits
Dotnet Script is required to be installed in the machine running the script.
You can install it via dotnet global tools using: `dotnet tool install -g dotnet-script`

For more info check their github repo !(here)[https://github.com/filipw/dotnet-script]

### SeqAPIWrapper runs by default as a dry run as not to flood SEQ by accident

The SeqAPIWrapper contains the following functionality:
- Register new API Keys 
- Register Signals

### How to Run

In order to execute the script you can run `dotnet script [path to file]`

### Generic Info
#### Version
dotnet script is currently running on **.Net Core 2.1**
#### Nuget packages
In order to use Nuget packages it follows a similar approach to cake. 
Use the following notation to include packages at the **top** of your .csx
`#r "nuget: PackageName, version"`
#### Arguments
Dotnet script has notion of it's own arguments and arguments passed to your program
`dotnet script -d foo.csx -- cko`
In this example `-d` is the dotnet-script argument and anything after `--` is an argument passed to the program through the global `Args` variable.

