using System.Security.Claims;

namespace Mms.Api.Modules.Dashboard;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/dashboard")
            .WithTags("Dashboard");

        group.MapGet("/tv-overview", async (DashboardGateway gateway, CancellationToken cancellationToken) =>
        {
            var overview = await gateway.GetTvDashboardOverviewAsync(cancellationToken);
            return Results.Ok(overview);
        }).WithName("DASH-01_GetTvDashboardOverview");

        return endpoints;
    }
}
