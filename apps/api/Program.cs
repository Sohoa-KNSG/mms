using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Mms.Api.Authentication;
using Mms.Api.Configuration;
using Mms.Api.Infrastructure.Errors;
using Mms.Api.Infrastructure.Sql;
using Mms.Api.Modules.Access;
using Mms.Api.Modules.Administration;
using Mms.Api.Modules.Quality;
using Mms.Api.Modules.ReadModels;
using Mms.Api.Modules.Receiving;
using Mms.Api.Modules.InventoryOperations;
using Mms.Api.Modules.LocationOperations;
using Mms.Api.Modules.OutboundRequests;
using Mms.Api.Modules.OutboundPicking;
using Mms.Api.Modules.InternalReturns;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddOptions<SqlOptions>()
    .BindConfiguration(SqlOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddAuthentication(DevelopmentAuthenticationHandler.SchemeName)
        .AddScheme<AuthenticationSchemeOptions, DevelopmentAuthenticationHandler>(
            DevelopmentAuthenticationHandler.SchemeName,
            _ => { });
}
else
{
    var authority = builder.Configuration["Authentication:Authority"];
    var audience = builder.Configuration["Authentication:Audience"];
    if (string.IsNullOrWhiteSpace(authority) || string.IsNullOrWhiteSpace(audience))
    {
        throw new InvalidOperationException("Authentication:Authority và Authentication:Audience là bắt buộc ngoài Development.");
    }

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = authority;
            options.Audience = audience;
            options.RequireHttpsMetadata = true;
        });
}

builder.Services.AddAuthorization();
builder.Services.AddHealthChecks();
builder.Services.AddSingleton<ISqlConnectionFactory, SqlConnectionFactory>();
builder.Services.AddScoped<AccessGateway>();
builder.Services.AddScoped<AdministrationGateway>();
builder.Services.AddScoped<QualityGateway>();
builder.Services.AddScoped<ReadGateway>();
builder.Services.AddScoped<ReceivingGateway>();
builder.Services.AddScoped<InventoryOperationGateway>();
builder.Services.AddScoped<LocationOperationGateway>();
builder.Services.AddScoped<OutboundRequestGateway>();
builder.Services.AddScoped<OutboundPickingGateway>();
builder.Services.AddScoped<InternalReturnGateway>();

var app = builder.Build();

app.UseMiddleware<SqlExceptionMiddleware>();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health").AllowAnonymous();
app.MapAccessEndpoints();
app.MapAdministrationEndpoints();
app.MapQualityEndpoints();
app.MapReadEndpoints();
app.MapReceivingEndpoints();
app.MapInventoryOperationEndpoints();
app.MapLocationOperationEndpoints();
app.MapOutboundRequestEndpoints();
app.MapOutboundPickingEndpoints();
app.MapInternalReturnEndpoints();

app.Run();

public partial class Program { }
