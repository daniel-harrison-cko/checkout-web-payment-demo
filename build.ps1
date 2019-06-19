##########################################################################
# This is the Cake bootstrapper script for PowerShell.
# This file was downloaded from https://github.com/cake-build/resources
# Feel free to change this file to fit your needs.
##########################################################################

<#

.SYNOPSIS
This is a Powershell script to bootstrap a Cake build.

.DESCRIPTION
This Powershell script will download NuGet if missing, restore NuGet tools (including Cake)
and execute your Cake build script with the parameters you provide.

.PARAMETER Script
The build script to execute.
.PARAMETER Target
The build script target to run.
.PARAMETER Configuration
The build configuration to use.
.PARAMETER Verbosity
Specifies the amount of information to be displayed.
.PARAMETER ShowDescription
Shows description about tasks.
.PARAMETER DryRun
Performs a dry run.
.PARAMETER Experimental
Uses the nightly builds of the Roslyn script engine.
.PARAMETER Mono
Uses the Mono Compiler rather than the Roslyn script engine.
.PARAMETER SkipToolPackageRestore
Skips restoring of packages.
.PARAMETER ScriptArgs
Remaining arguments are added here.

.LINK
https://cakebuild.net

#>

[CmdletBinding()]
Param(
    [string]$Script = "build.cake",
    [string]$Target,
    [string]$Configuration,
    [ValidateSet("Quiet", "Minimal", "Normal", "Verbose", "Diagnostic")]
    [string]$Verbosity,
    [switch]$ShowDescription,
    [Alias("WhatIf", "Noop")]
    [switch]$DryRun,
    [switch]$Experimental,
    [switch]$Mono,
    [switch]$SkipToolPackageRestore,
    [Parameter(Position=0,Mandatory=$false,ValueFromRemainingArguments=$true)]
    [string[]]$ScriptArgs
)

[Reflection.Assembly]::LoadWithPartialName("System.Security") | Out-Null
function MD5HashFile([string] $filePath)
{
    if ([string]::IsNullOrEmpty($filePath) -or !(Test-Path $filePath -PathType Leaf))
    {
        return $null
    }

    [System.IO.Stream] $file = $null;
    [System.Security.Cryptography.MD5] $md5 = $null;
    try
    {
        $md5 = [System.Security.Cryptography.MD5]::Create()
        $file = [System.IO.File]::OpenRead($filePath)
        return [System.BitConverter]::ToString($md5.ComputeHash($file))
    }
    finally
    {
        if ($file -ne $null)
        {
            $file.Dispose()
        }
    }
}

Write-Host "Preparing to run build script..."

if(!$PSScriptRoot){
    $PSScriptRoot = Split-Path $MyInvocation.MyCommand.Path -Parent
}

$TOOLS_DIR = Join-Path $PSScriptRoot "tools"
$TOOLS_CSPROJ = Join-Path $TOOLS_DIR "tools.csproj"
$CAKE_DLL = "cake.dll"
$TOOLS_MD5 = Join-Path $TOOLS_DIR "tools.csproj.md5sum"

# Make sure tools folder exists
if ((Test-Path $PSScriptRoot) -and !(Test-Path $TOOLS_DIR)) {
    Write-Verbose -Message "Creating tools directory..."
    New-Item -Path $TOOLS_DIR -Type directory | out-null
}

# Install or update tools
if (-Not $SkipToolPackageRestore.IsPresent) {
    # Check for changes in tools.csproj
    [string] $md5Hash = MD5HashFile($TOOLS_CSPROJ)
    if( !(Get-ChildItem -Path $TOOLS_DIR -Include $CAKE_DLL -File -Recurse) -or
        !(Test-Path $TOOLS_MD5) -or
        $md5Hash -ne (Get-Content $TOOLS_MD5 )) {
        
        # removes all files except tools.csproj
        Push-Location
        Set-Location $TOOLS_DIR    
        Write-Verbose -Message "Missing or changed tools.csproj hash..."
        Get-ChildItem -Exclude tools.csproj |
        Remove-Item -Recurse
    
        # restores tools from tools.csproj
        Write-Verbose -Message "Restoring tools from tools.csproj..."
        dotnet restore --packages $TOOLS_DIR

        if ($LASTEXITCODE -ne 0) {
            Throw "An error occurred while restoring tools.csproj."
        }
        else
        {
            $md5Hash | Out-File $TOOLS_MD5 -Encoding "ASCII"
        }
        Pop-Location
    }
}

# Make sure that Cake has been installed.
$CAKE_DLL_PATH = Get-ChildItem -Path $TOOLS_DIR -Include $CAKE_DLL -File -Recurse
if ($CAKE_DLL_PATH -eq $null) {
    Throw "Could not find Cake.dll"
}

# Build Cake arguments
$cakeArguments = @("$Script");
if ($Target) { $cakeArguments += "-target=$Target" }
if ($Configuration) { $cakeArguments += "-configuration=$Configuration" }
if ($Verbosity) { $cakeArguments += "-verbosity=$Verbosity" }
if ($ShowDescription) { $cakeArguments += "-showdescription" }
if ($DryRun) { $cakeArguments += "-dryrun" }
if ($Experimental) { $cakeArguments += "-experimental" }
if ($Mono) { $cakeArguments += "-mono" }
$cakeArguments += $ScriptArgs

# Start Cake
Write-Host "Running build script..."
dotnet $CAKE_DLL_PATH $cakeArguments

exit $LASTEXITCODE