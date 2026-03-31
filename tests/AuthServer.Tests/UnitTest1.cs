using System.Security.Claims;
using AuthServer;
using AuthServer.Services;
using Duende.IdentityServer;
using Duende.IdentityServer.Models;
using IdentityModel;
using IdentityServerHost.Models;
using Microsoft.AspNetCore.Identity;

namespace AuthServer.Tests;

public class TokenUserContextProfileServiceTests
{
    [Fact]
    public async Task GetProfileDataAsync_ForLoginUser_EmitsBaseClaimsOnly()
    {
        var effective = new ApplicationUser
        {
            Id = "user-1",
            UserName = "alice",
            Email = "alice@example.com"
        };

        var service = CreateService([effective]);
        var context = CreateProfileContext(
            subjectId: effective.Id,
            extraClaims: [],
            requestedClaimTypes: [JwtClaimTypes.Name, JwtClaimTypes.Email, TokenUserContextClaims.SwitchMode]);

        await service.GetProfileDataAsync(context);

        AssertClaim(context.IssuedClaims, JwtClaimTypes.Name, "alice");
        AssertClaim(context.IssuedClaims, JwtClaimTypes.Email, "alice@example.com");
        Assert.DoesNotContain(context.IssuedClaims, c => c.Type == TokenUserContextClaims.SwitchMode);
        Assert.DoesNotContain(context.IssuedClaims, c => c.Type == TokenUserContextClaims.OriginalSubject);
        Assert.DoesNotContain(context.IssuedClaims, c => c.Type == TokenUserContextClaims.OriginalName);
        Assert.DoesNotContain(context.IssuedClaims, c => c.Type == TokenUserContextClaims.OriginalEmail);
    }

    [Fact]
    public async Task GetProfileDataAsync_ForSwitchedUser_EmitsOriginalActorClaims()
    {
        var effective = new ApplicationUser
        {
            Id = "user-2",
            UserName = "bob",
            Email = "bob@example.com"
        };

        var original = new ApplicationUser
        {
            Id = "user-1",
            UserName = "alice",
            Email = "alice@example.com"
        };

        var service = CreateService([effective, original]);
        var context = CreateProfileContext(
            subjectId: effective.Id,
            extraClaims: [new Claim(TokenUserContextClaims.OriginalUserNameSession, original.UserName!)],
            requestedClaimTypes:
            [
                JwtClaimTypes.Name,
                JwtClaimTypes.Email,
                TokenUserContextClaims.SwitchMode,
                TokenUserContextClaims.OriginalSubject,
                TokenUserContextClaims.OriginalName,
                TokenUserContextClaims.OriginalEmail
            ]);

        await service.GetProfileDataAsync(context);

        AssertClaim(context.IssuedClaims, JwtClaimTypes.Name, "bob");
        AssertClaim(context.IssuedClaims, JwtClaimTypes.Email, "bob@example.com");
        AssertClaim(context.IssuedClaims, TokenUserContextClaims.SwitchMode, "true");
        AssertClaim(context.IssuedClaims, TokenUserContextClaims.OriginalSubject, "user-1");
        AssertClaim(context.IssuedClaims, TokenUserContextClaims.OriginalName, "alice");
        AssertClaim(context.IssuedClaims, TokenUserContextClaims.OriginalEmail, "alice@example.com");
    }

    [Fact]
    public async Task GetProfileDataAsync_WhenOriginalMatchesEffective_DoesNotEmitSwitchedClaims()
    {
        var effective = new ApplicationUser
        {
            Id = "user-3",
            UserName = "carol",
            Email = "carol@example.com"
        };

        var service = CreateService([effective]);
        var context = CreateProfileContext(
            subjectId: effective.Id,
            extraClaims: [new Claim(TokenUserContextClaims.OriginalUserNameSession, effective.UserName!)],
            requestedClaimTypes:
            [
                JwtClaimTypes.Name,
                JwtClaimTypes.Email,
                TokenUserContextClaims.SwitchMode,
                TokenUserContextClaims.OriginalSubject,
                TokenUserContextClaims.OriginalName,
                TokenUserContextClaims.OriginalEmail
            ]);

        await service.GetProfileDataAsync(context);

        AssertClaim(context.IssuedClaims, JwtClaimTypes.Name, "carol");
        AssertClaim(context.IssuedClaims, JwtClaimTypes.Email, "carol@example.com");
        Assert.DoesNotContain(context.IssuedClaims, c => c.Type == TokenUserContextClaims.SwitchMode);
        Assert.DoesNotContain(context.IssuedClaims, c => c.Type == TokenUserContextClaims.OriginalSubject);
        Assert.DoesNotContain(context.IssuedClaims, c => c.Type == TokenUserContextClaims.OriginalName);
        Assert.DoesNotContain(context.IssuedClaims, c => c.Type == TokenUserContextClaims.OriginalEmail);
    }

    [Fact]
    public async Task IsActiveAsync_ReturnsTrueOnlyWhenUserExists()
    {
        var effective = new ApplicationUser
        {
            Id = "user-4",
            UserName = "dave",
            Email = "dave@example.com"
        };

        var service = CreateService([effective]);

        var activeContext = new IsActiveContext(new ClaimsPrincipal(new ClaimsIdentity([
            new Claim(JwtClaimTypes.Subject, effective.Id)
        ])), new Client(), IdentityServerConstants.ProfileDataCallers.UserInfoEndpoint);

        await service.IsActiveAsync(activeContext);
        Assert.True(activeContext.IsActive);

        var missingContext = new IsActiveContext(new ClaimsPrincipal(new ClaimsIdentity([
            new Claim(JwtClaimTypes.Subject, "missing-id")
        ])), new Client(), IdentityServerConstants.ProfileDataCallers.UserInfoEndpoint);

        await service.IsActiveAsync(missingContext);
        Assert.False(missingContext.IsActive);
    }

    private static TokenUserContextProfileService CreateService(IEnumerable<ApplicationUser> users)
    {
        var userManager = new FakeUserManager(users);
        return new TokenUserContextProfileService(userManager);
    }

    private static ProfileDataRequestContext CreateProfileContext(
        string subjectId,
        IEnumerable<Claim> extraClaims,
        IEnumerable<string> requestedClaimTypes)
    {
        var claims = new List<Claim> { new(JwtClaimTypes.Subject, subjectId) };
        claims.AddRange(extraClaims);

        return new ProfileDataRequestContext(
            new ClaimsPrincipal(new ClaimsIdentity(claims, "pwd")),
            new Client(),
            IdentityServerConstants.ProfileDataCallers.UserInfoEndpoint,
            requestedClaimTypes.ToList());
    }

    private static void AssertClaim(IEnumerable<Claim> claims, string type, string value)
    {
        var claim = Assert.Single(claims, c => c.Type == type);
        Assert.Equal(value, claim.Value);
    }

    private sealed class FakeUserManager : UserManager<ApplicationUser>
    {
        private readonly Dictionary<string, ApplicationUser> _byId;
        private readonly Dictionary<string, ApplicationUser> _byName;

        public FakeUserManager(IEnumerable<ApplicationUser> users)
            : base(
                new FakeUserStore(),
                null!,
                new PasswordHasher<ApplicationUser>(),
                [],
                [],
                null!,
                null!,
                null!,
                null!)
        {
            _byId = users.ToDictionary(u => u.Id, StringComparer.Ordinal);
            _byName = users
                .Where(u => !string.IsNullOrWhiteSpace(u.UserName))
                .ToDictionary(u => u.UserName!, StringComparer.OrdinalIgnoreCase);
        }

        public override Task<ApplicationUser?> FindByIdAsync(string userId)
        {
            _byId.TryGetValue(userId, out var user);
            return Task.FromResult(user);
        }

        public override Task<ApplicationUser?> FindByNameAsync(string userName)
        {
            _byName.TryGetValue(userName, out var user);
            return Task.FromResult(user);
        }

        private sealed class FakeUserStore : IUserPasswordStore<ApplicationUser>
        {
            public void Dispose()
            {
            }

            public Task<string> GetUserIdAsync(ApplicationUser user, CancellationToken cancellationToken)
                => Task.FromResult(user.Id);

            public Task<string?> GetUserNameAsync(ApplicationUser user, CancellationToken cancellationToken)
                => Task.FromResult(user.UserName);

            public Task SetUserNameAsync(ApplicationUser user, string? userName, CancellationToken cancellationToken)
                => Task.CompletedTask;

            public Task<string?> GetNormalizedUserNameAsync(ApplicationUser user, CancellationToken cancellationToken)
                => Task.FromResult(user.NormalizedUserName);

            public Task SetNormalizedUserNameAsync(ApplicationUser user, string? normalizedName, CancellationToken cancellationToken)
                => Task.CompletedTask;

            public Task<IdentityResult> CreateAsync(ApplicationUser user, CancellationToken cancellationToken)
                => Task.FromResult(IdentityResult.Success);

            public Task<IdentityResult> UpdateAsync(ApplicationUser user, CancellationToken cancellationToken)
                => Task.FromResult(IdentityResult.Success);

            public Task<IdentityResult> DeleteAsync(ApplicationUser user, CancellationToken cancellationToken)
                => Task.FromResult(IdentityResult.Success);

            public Task<ApplicationUser?> FindByIdAsync(string userId, CancellationToken cancellationToken)
                => Task.FromResult<ApplicationUser?>(null);

            public Task<ApplicationUser?> FindByNameAsync(string normalizedUserName, CancellationToken cancellationToken)
                => Task.FromResult<ApplicationUser?>(null);

            public Task SetPasswordHashAsync(ApplicationUser user, string? passwordHash, CancellationToken cancellationToken)
                => Task.CompletedTask;

            public Task<string?> GetPasswordHashAsync(ApplicationUser user, CancellationToken cancellationToken)
                => Task.FromResult<string?>(null);

            public Task<bool> HasPasswordAsync(ApplicationUser user, CancellationToken cancellationToken)
                => Task.FromResult(false);
        }
    }
}
