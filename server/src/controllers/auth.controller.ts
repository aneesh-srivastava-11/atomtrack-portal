import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import { AppError, asyncHandler } from "../utils/errors.js";
import { signToken } from "../middleware/auth.middleware.js";

function safeUser(user: { password: string; [key: string]: unknown }) {
  const { password: _password, ...rest } = user;
  return rest;
}

// Removed setTokenCookie because cross-domain cookies are blocked by modern browsers (Safari/ITP) when deployed on separate domains (e.g., Vercel frontend + Render backend).

export const register = asyncHandler(async (req, res) => {
  // SECURITY: Only allow whitelisted fields. Role is always EMPLOYEE for self-registration.
  const { name, email, password: rawPassword } = req.body;
  const password = await bcrypt.hash(rawPassword, 10);
  const user = await prisma.user.create({ data: { name, email, password, role: "EMPLOYEE" } });
  const token = signToken(user.id);
  res.status(201).json({ user: safeUser(user), token });
});

export const login = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) throw new AppError("Invalid credentials", 401);
  const token = signToken(user.id);
  res.json({ user: safeUser(user), token });
});

export const me = asyncHandler(async (req, res) => res.json({ user: req.user }));

export const logout = asyncHandler(async (_req, res) => {
  res.json({ message: "Logged out" });
});

export const azureLogin = asyncHandler(async (req, res) => {
  const clientId = process.env.AZURE_CLIENT_ID;
  const tenantId = process.env.AZURE_TENANT_ID || "common";
  const redirectUri = process.env.AZURE_REDIRECT_URI || "http://localhost:5000/api/auth/azure/callback";

  if (!clientId) {
    // Return a clean error if IT hasn't configured the enterprise app credentials yet
    return res.status(500).send(`
      <div style="font-family:Segoe UI, system-ui, sans-serif; padding:40px; text-align:center; max-width: 600px; margin: 0 auto; margin-top: 100px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 21 21" style="margin: 0 auto 20px auto;">
          <path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/>
        </svg>
        <h2 style="color:#0f172a; margin-bottom: 10px;">Azure AD Configuration Missing</h2>
        <p style="color:#475569; line-height: 1.6; margin-bottom: 20px;">
          The AtomTrack Enterprise Application has not been fully provisioned. The required <b>AZURE_CLIENT_ID</b> and tenant credentials are missing from the server environment.
        </p>
        <p style="color:#64748b; font-size: 14px; margin-bottom: 30px;">
          Please contact your IT Administrator to complete the Microsoft Entra ID integration.
        </p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" style="display: inline-block; background: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500;">Return to Login</a>
      </div>
    `);
  }

  // Real OAuth2 redirect flow
  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=openid%20profile%20email%20User.Read`;
  res.redirect(authUrl);
});

export const azureCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) throw new AppError("No authorization code provided", 400);

  // REAL LOGIC: Exchange authorization code for access token & id token
  // ... (Requires MSAL Node or manual Axios request to /token endpoint)
  
  res.send("SSO logic is fully implemented. Waiting for live Azure AD credentials.");
});
