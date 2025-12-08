# Email Configuration Status

## Current Status

### Cloud Environment
- **Status:** Email credentials need to be updated
- **Issue:** Invalid placeholder values in environment variables
- **Impact:** Emails will not be sent (but data is still saved)

### Local Development
- **Status:** Should work if you have valid Azure AD credentials
- **Configuration:** Set in your local `backend/.env` file

## Setup Instructions

1. **Get Azure AD Credentials:**
   - Go to Azure Portal → Azure Active Directory → App Registrations
   - Create or select your app
   - Copy: Tenant ID, Client ID
   - Generate: Client Secret

2. **Update Your Local `.env` File:**
   ```bash
   TENANT_ID=<your-azure-tenant-id>
   CLIENT_ID=<your-azure-client-id>
   CLIENT_SECRET=<your-azure-client-secret>
   EMAIL_FROM=<your-verified-email@domain.com>
   ```

3. **Required Permissions:**
   - Mail.Send (Application permission)
   - User.Read (Delegated permission)

4. **Test:**
   - Restart your local backend
   - Try the TDEE calculator "Send to Email" feature
   - Check backend logs for success/error messages

## Features That Use Email

1. TDEE Calculator Results
2. Contact Form Notifications
3. Password Reset Links
4. Client Onboarding Emails
5. Newsletter Welcome Emails

## Troubleshooting

**Common Issues:**
- Invalid credentials: Check Azure AD configuration
- Permission errors: Verify Mail.Send permission is granted
- 403 errors: Ensure client secret hasn't expired

**Check Logs:**
```bash
# Look for email-related messages
tail -f /var/log/supervisor/backend.out.log | grep -i email
```

## Security Note

⚠️ **Never commit `.env` files or paste real credentials in:**
- Documentation files
- Code comments
- Git commits
- Screenshots
- Support tickets

All sensitive values should only exist in `.env` files which are gitignored.
