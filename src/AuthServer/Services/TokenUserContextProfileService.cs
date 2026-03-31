using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Duende.IdentityServer.Extensions;
using Duende.IdentityServer.Models;
using Duende.IdentityServer.Services;
using IdentityModel;
using IdentityServerHost.Models;
using Microsoft.AspNetCore.Identity;

namespace AuthServer.Services;

public sealed class TokenUserContextProfileService : IProfileService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public TokenUserContextProfileService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task GetProfileDataAsync(ProfileDataRequestContext context)
    {
        var subjectId = context.Subject.GetSubjectId();
        if (string.IsNullOrWhiteSpace(subjectId))
        {
            context.IssuedClaims = [];
            return;
        }

        var effectiveUser = await _userManager.FindByIdAsync(subjectId);
        if (effectiveUser == null)
        {
            context.IssuedClaims = [];
            return;
        }

        var claims = new List<Claim>();
        var effectiveName = ResolveEffectiveName(context.Subject, effectiveUser);

        claims.Add(new Claim(JwtClaimTypes.Name, effectiveName));

        if (!string.IsNullOrWhiteSpace(effectiveUser.Email))
        {
            claims.Add(new Claim(JwtClaimTypes.Email, effectiveUser.Email));
        }

        var originalUserName = context.Subject.FindFirstValue(TokenUserContextClaims.OriginalUserNameSession);
        var isSwitched =
            !string.IsNullOrWhiteSpace(originalUserName) &&
            !string.Equals(originalUserName, effectiveUser.UserName, StringComparison.OrdinalIgnoreCase);

        if (isSwitched)
        {
            claims.Add(new Claim(TokenUserContextClaims.SwitchMode, "true"));

            var originalUser = await _userManager.FindByNameAsync(originalUserName!);
            if (originalUser != null)
            {
                claims.Add(new Claim(TokenUserContextClaims.OriginalSubject, originalUser.Id));
                claims.Add(new Claim(TokenUserContextClaims.OriginalName, ResolveOriginalName(originalUser)));

                if (!string.IsNullOrWhiteSpace(originalUser.Email))
                {
                    claims.Add(new Claim(TokenUserContextClaims.OriginalEmail, originalUser.Email));
                }
            }
        }

        var requestedClaimTypes = context.RequestedClaimTypes?.ToHashSet(StringComparer.Ordinal);
        context.IssuedClaims = requestedClaimTypes == null || requestedClaimTypes.Count == 0
            ? claims
            : claims.Where(c => requestedClaimTypes.Contains(c.Type)).ToList();
    }

    public async Task IsActiveAsync(IsActiveContext context)
    {
        var subjectId = context.Subject.GetSubjectId();
        if (string.IsNullOrWhiteSpace(subjectId))
        {
            context.IsActive = false;
            return;
        }

        context.IsActive = await _userManager.FindByIdAsync(subjectId) != null;
    }

    private static string ResolveEffectiveName(ClaimsPrincipal subject, ApplicationUser user)
    {
        return subject.FindFirstValue(JwtClaimTypes.Name)
            ?? subject.Identity?.Name
            ?? user.UserName
            ?? user.Id;
    }

    private static string ResolveOriginalName(ApplicationUser originalUser)
    {
        return originalUser.UserName ?? originalUser.Id;
    }
}
