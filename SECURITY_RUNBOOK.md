# Security Runbook (JP Checklist)

This project implements technical controls in code, but some checklist items are operational and must be completed in external services.

## Implemented in application

- Admin endpoint protection with IP allowlist + Basic auth:
  - `ADMIN_ALLOWED_IPS`
  - `ADMIN_BASIC_USER`
  - `ADMIN_BASIC_PASS`
- Admin auth lock policy:
  - `ADMIN_LOCK_MAX_ATTEMPTS` (<= 10)
  - `ADMIN_LOCK_WINDOW_MS`
- Suspicious IP block list:
  - `BLOCKED_IPS`
- Automatic temporary IP blocking:
  - Triggered by repeated login lockouts
  - Triggered by excessive billing endpoint access
- User login throttling and temporary lockout after repeated failures.
- Billing API anti-automation rate limits.
- Security headers including CSP, HSTS (when secure cookie is enabled), nosniff, frame options.
- Upload type and size limits (images only).

## Required external operations (must complete to answer "Yes")

1. Enforce MFA/2FA for all admin accounts:
   - Stripe dashboard admins
   - Hosting/deployment admins
   - DNS/CDN/WAF admins
2. Configure production IP allow rules in your edge firewall/WAF.
3. Deploy anti-malware policy on operator endpoints/servers and keep signatures updated.
4. Run periodic vulnerability scans and keep evidence:
   - Run `npm run security:check`
   - GitHub Actions: `.github/workflows/security-check.yml` (push/PR/weekly)
   - Keep audit logs and remediation records
5. Keep evidence screenshots for declaration:
   - WAF/IP allowlist config
   - MFA enabled pages
   - Account lockout policy
   - Scan result logs

## Windows automation (evidence collection)

Run these commands in PowerShell.

1. Defender evidence (quick scan + logs):

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\security\collect-defender-evidence.ps1 -ScanType Quick
   ```

2. Monthly vulnerability evidence (`npm audit`, syntax check, security check):

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\security\run-monthly-security-check.ps1
   ```

3. Output location:
   - `security-reports/defender-status-YYYY-MM.txt`
   - `security-reports/defender-scan-log.txt`
   - `security-reports/npm-audit-YYYY-MM.txt`
   - `security-reports/node-check-YYYY-MM.txt`
   - `security-reports/security-check-YYYY-MM.txt`

