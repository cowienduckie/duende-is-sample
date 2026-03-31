using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AuthServer;
using Duende.IdentityServer.Extensions;
using IdentityServerHost.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IdentityServerHost.Quickstart.UI
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SessionController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;

        public SessionController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
        }

        [HttpGet("Context")]
        public async Task<ActionResult<SessionContextResponse>> GetContext()
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser?.UserName == null)
            {
                return Unauthorized();
            }

            var originalUserName = User.FindFirstValue(TokenUserContextClaims.OriginalUserNameSession) ?? currentUser.UserName;
            var context = await BuildSessionContextResponseAsync(currentUser.UserName, originalUserName);
            return Ok(context);
        }

        [HttpPost("Switch")]
        public async Task<ActionResult<SessionContextResponse>> Switch([FromBody] SwitchUserRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.TargetUserName))
            {
                return BadRequest("targetUserName is required.");
            }

            var currentUser = await GetCurrentUserAsync();
            if (currentUser?.UserName == null)
            {
                return Unauthorized();
            }

            if (string.Equals(request.TargetUserName, currentUser.UserName, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Cannot switch to the current user.");
            }

            var targetUser = await _userManager.FindByNameAsync(request.TargetUserName);
            if (targetUser?.UserName == null)
            {
                return NotFound($"User '{request.TargetUserName}' was not found.");
            }

            var originalUserName = User.FindFirstValue(TokenUserContextClaims.OriginalUserNameSession) ?? currentUser.UserName;
            var extraClaims = new List<Claim>();

            if (!string.Equals(originalUserName, targetUser.UserName, StringComparison.OrdinalIgnoreCase))
            {
                extraClaims.Add(new Claim(TokenUserContextClaims.OriginalUserNameSession, originalUserName));
            }

            await _signInManager.SignOutAsync();
            await _signInManager.SignInWithClaimsAsync(targetUser, isPersistent: false, extraClaims);

            var context = await BuildSessionContextResponseAsync(targetUser.UserName, originalUserName);
            return Ok(context);
        }

        [HttpPost("SwitchBack")]
        public async Task<ActionResult<SessionContextResponse>> SwitchBack()
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser?.UserName == null)
            {
                return Unauthorized();
            }

            var originalUserName = User.FindFirstValue(TokenUserContextClaims.OriginalUserNameSession);
            if (string.IsNullOrWhiteSpace(originalUserName))
            {
                return BadRequest("No original user context found for switch-back.");
            }

            if (string.Equals(currentUser.UserName, originalUserName, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Current session already belongs to the original user.");
            }

            var originalUser = await _userManager.FindByNameAsync(originalUserName);
            if (originalUser?.UserName == null)
            {
                return NotFound($"Original user '{originalUserName}' was not found.");
            }

            await _signInManager.SignOutAsync();
            await _signInManager.SignInAsync(originalUser, isPersistent: false);

            var context = await BuildSessionContextResponseAsync(originalUser.UserName, originalUser.UserName);
            return Ok(context);
        }

        private async Task<ApplicationUser> GetCurrentUserAsync()
        {
            var subjectId = User.GetSubjectId();
            if (string.IsNullOrWhiteSpace(subjectId))
            {
                return null;
            }

            return await _userManager.FindByIdAsync(subjectId);
        }

        private async Task<SessionContextResponse> BuildSessionContextResponseAsync(string effectiveUserName, string originalUserName)
        {
            var switchableUsers = await _userManager.Users
                .AsNoTracking()
                .Select(x => x.UserName)
                .Where(x => x != null && !x.Equals(effectiveUserName))
                .OrderBy(x => x)
                .ToListAsync();

            return new SessionContextResponse
            {
                EffectiveUserName = effectiveUserName,
                OriginalUserName = originalUserName,
                IsSwitched = !string.Equals(effectiveUserName, originalUserName, StringComparison.OrdinalIgnoreCase),
                SwitchableUsers = switchableUsers
            };
        }
    }

    public class SwitchUserRequest
    {
        public string TargetUserName { get; set; }
    }

    public class SessionContextResponse
    {
        public string EffectiveUserName { get; set; }
        public string OriginalUserName { get; set; }
        public bool IsSwitched { get; set; }
        public List<string> SwitchableUsers { get; set; }
    }
}
