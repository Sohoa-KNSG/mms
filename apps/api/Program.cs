using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Mms.Api.Authentication;
using Mms.Api.Configuration;
using Mms.Api.Infrastructure.Errors;
using Mms.Api.Infrastructure.Json;
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

var useDevelopmentIdentity = !string.IsNullOrWhiteSpace(builder.Configuration["Authentication:DevelopmentUser"])
    || builder.Environment.IsDevelopment();
var defaultAuthenticationScheme = useDevelopmentIdentity
    ? DevelopmentAuthenticationHandler.SchemeName
    : CookieAuthenticationDefaults.AuthenticationScheme;
builder.Services.AddAuthentication(defaultAuthenticationScheme)
    .AddScheme<AuthenticationSchemeOptions, DevelopmentAuthenticationHandler>(DevelopmentAuthenticationHandler.SchemeName, _ => { })
    .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
    {
        options.Cookie.Name = "MMS.Session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.Cookie.MaxAge = TimeSpan.FromDays(30);
        options.ExpireTimeSpan = TimeSpan.FromDays(30);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = 401; return Task.CompletedTask; };
        options.Events.OnRedirectToAccessDenied = context => { context.Response.StatusCode = 403; return Task.CompletedTask; };
    });

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new Utc7DateTimeJsonConverter());
    options.SerializerOptions.Converters.Add(new Utc7NullableDateTimeJsonConverter());
});

builder.Services.AddAuthorization();
builder.Services.AddHttpClient();
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
