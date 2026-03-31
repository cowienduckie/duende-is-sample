namespace AuthServer;

public static class TokenUserContextClaims
{
    // Internal cookie/session claim used to carry original actor username across switch operations.
    public const string OriginalUserNameSession = "switch_original_username";

    // Public token claims consumed by OIDC clients.
    public const string SwitchMode = "switch_mode";
    public const string OriginalSubject = "original_sub";
    public const string OriginalName = "original_name";
    public const string OriginalEmail = "original_email";
}
