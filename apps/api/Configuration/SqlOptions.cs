using System.ComponentModel.DataAnnotations;

namespace Mms.Api.Configuration;

public sealed class SqlOptions
{
    public const string SectionName = "Sql";

    [Range(1, 300)]
    public int CommandTimeoutSeconds { get; init; } = 30;
}

