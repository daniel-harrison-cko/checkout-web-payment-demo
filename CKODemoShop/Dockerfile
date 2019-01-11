FROM danielmunchcko/dotnet:2.1.302-node-10.7.0 AS build
ARG BUILDCONFIG=RELEASE
ARG VERSION=1.0.0

# copy csproj and restore as distinct layers
COPY ./CKODemoShop.csproj /src/
COPY ./nuget.config /src/

RUN dotnet restore /src/CKODemoShop.csproj

# copy everything else and build
COPY ./ /src
WORKDIR /src
RUN dotnet publish -c $BUILDCONFIG -o out /p:Version=$VERSION

#build runtime image
FROM microsoft/dotnet:2.1-aspnetcore-runtime-alpine
WORKDIR /app
COPY --from=build /src/out .

EXPOSE 5050
CMD ["dotnet", "CKODemoShop.dll"]
