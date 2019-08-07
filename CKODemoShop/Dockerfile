FROM danielmunchcko/dotnet:2.2.100-node-10.15.0 AS build	

ARG BUILDCONFIG=RELEASE
ARG VERSION=1.0.0

# copy csproj and restore as distinct layers
COPY ./CKODemoShop/CKODemoShop.csproj /src/
COPY ./CKODemoShop/nuget.config /src/

RUN dotnet restore /src/CKODemoShop.csproj --configfile /src/nuget.config

# copy everything else and build
COPY ./ /src
WORKDIR /src/CKODemoShop/
RUN dotnet publish -c $BUILDCONFIG -o out /p:Version=$VERSION

#build runtime image
FROM microsoft/dotnet:2.2-aspnetcore-runtime-alpine	
WORKDIR /app
COPY --from=build /src/CKODemoShop/out .

EXPOSE 5050
CMD ["dotnet", "CKODemoShop.dll"]