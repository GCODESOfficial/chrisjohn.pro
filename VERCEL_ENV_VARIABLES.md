# Vercel Environment Variables Setup

## Required Environment Variables for Email Functionality

To enable email sending in production, you need to set these environment variables in your Vercel dashboard:

### Email/SMTP Configuration (REQUIRED for emails to work)

1. **SMTP_HOST**
   - Your SMTP server hostname
   - Example: `smtp.gmail.com`, `smtp.sendgrid.net`, `smtp.mailgun.org`

2. **SMTP_PORT**
   - SMTP server port (usually 587 or 465)
   - Example: `587` (for TLS) or `465` (for SSL)

3. **SMTP_SECURE**
   - Set to `true` for port 465 (SSL), `false` for port 587 (TLS)
   - Example: `false` (for most modern SMTP servers)

4. **SMTP_USER**
   - Your SMTP username/email
   - Example: `your-email@gmail.com` or your SMTP service username

5. **SMTP_PASS**
   - Your SMTP password or app-specific password
   - Example: Your Gmail app password or SMTP service password

6. **EMAIL_FROM**
   - The "from" email address for outgoing emails
   - Example: `noreply@thechrisjohn.pro` or `your-email@gmail.com`

7. **ADMIN_EMAIL** (Optional but recommended)
   - Email address to receive BCC copies of emails
   - Example: `admin@thechrisjohn.pro`

8. **CHRIS_EMAIL** (Optional, for "Let's Build" form)
   - Alternative to ADMIN_EMAIL for the build form
   - Example: `chris@thechrisjohn.pro`

### Other Required Environment Variables

9. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Example: `https://xxxxx.supabase.co`

10. **SUPABASE_SERVICE_ROLE_KEY**
    - Your Supabase service role key (keep secret!)

11. **PAYSTACK_SECRET_KEY**
    - Your Paystack secret key
    - Example: `sk_test_...` or `sk_live_...`

12. **NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY**
    - Your Paystack public key
    - Example: `pk_test_...` or `pk_live_...`

13. **TICKET_SIGNING_SECRET** (For event tickets)
    - A secret string for signing event tickets
    - Example: Generate a random string

14. **NEXT_PUBLIC_SITE_URL** (Optional)
    - Your production site URL
    - Example: `https://thechrisjohn.pro`

### Optional Environment Variables

15. **X_BEARER_TOKEN** (For X/Twitter integration)
16. **X_DEFAULT_USERNAME** (For X/Twitter integration)
17. **FACEBOOK_ACCESS_TOKEN** (For Facebook integration)
18. **FACEBOOK_PAGE_ID** (For Facebook integration)

## How to Set Environment Variables in Vercel

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com/dashboard
   - Select your project (`chrisjohn.pro`)

2. **Navigate to Settings:**
   - Click on your project
   - Go to **Settings** tab
   - Click on **Environment Variables** in the sidebar

3. **Add Each Variable:**
   - Click **Add New**
   - Enter the variable name (e.g., `SMTP_HOST`)
   - Enter the variable value
   - Select environments: **Production**, **Preview**, and/or **Development**
   - Click **Save**

4. **Redeploy:**
   - After adding all variables, go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy** to apply the new environment variables

## Quick Setup Checklist

- [ ] SMTP_HOST
- [ ] SMTP_PORT
- [ ] SMTP_SECURE
- [ ] SMTP_USER
- [ ] SMTP_PASS
- [ ] EMAIL_FROM
- [ ] ADMIN_EMAIL (optional)
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] PAYSTACK_SECRET_KEY
- [ ] NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
- [ ] TICKET_SIGNING_SECRET
- [ ] NEXT_PUBLIC_SITE_URL (optional)

## Testing After Setup

1. **Test Book Purchase Email:**
   - Make a test purchase
   - Check if confirmation email is sent

2. **Test Event Registration Email:**
   - Register for an event
   - Check if ticket email is sent

3. **Test "Let's Build" Form:**
   - Submit the form
   - Check if confirmation email is sent

4. **Check Vercel Logs:**
   - Go to **Deployments** → Click on deployment → **Functions** tab
   - Check logs for any email-related errors

## Common SMTP Providers

### Gmail
- SMTP_HOST: `smtp.gmail.com`
- SMTP_PORT: `587`
- SMTP_SECURE: `false`
- SMTP_USER: Your Gmail address
- SMTP_PASS: Gmail App Password (not your regular password)

### SendGrid
- SMTP_HOST: `smtp.sendgrid.net`
- SMTP_PORT: `587`
- SMTP_SECURE: `false`
- SMTP_USER: `apikey`
- SMTP_PASS: Your SendGrid API key

### Mailgun
- SMTP_HOST: `smtp.mailgun.org`
- SMTP_PORT: `587`
- SMTP_SECURE: `false`
- SMTP_USER: Your Mailgun SMTP username
- SMTP_PASS: Your Mailgun SMTP password

### Resend (Recommended for production)
- Use Resend API instead of SMTP (already in package.json)
- Set `RESEND_API_KEY` environment variable
- Consider migrating to Resend API for better reliability

