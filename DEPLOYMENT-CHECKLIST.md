
# Production launch checklist

- [ ] Replace all sample portfolio and product copy with approved content.
- [ ] Add privacy policy, terms, refund policy, and digital-product license terms.
- [ ] Configure production PostgreSQL, backups, TLS, and restricted access.
- [ ] Set AUTH_SECRET and provider credentials in hosting environment variables.
- [ ] Provision owner account privately; verify owner access and remove provisioning access.
- [ ] Add rate limiting, CAPTCHA/abuse controls, email verification, and password recovery.
- [ ] Implement and test Stripe checkout + signed webhooks + idempotent fulfillment.\n- [ ] Configure private S3-compatible storage and test five-minute customer-owned download links.\n- [ ] Upload products privately and attach object keys only; never use public download URLs.\n- [ ] Configure Resend email and verify domain authentication.\n- [ ] Review invoice numbering, tax rules, payment collection, and PDF requirements.\n- [ ] Validate analytics against a trusted accounting export before using for financial decisions.
- [ ] Implement private file storage and expiring download links.
- [ ] Add ticket assignment, email delivery verification, project milestone/task workflows, and customer-facing project discussion.
- [ ] Add audit logs for administrative actions.
- [ ] Add CSP/security headers, dependency scanning, and error monitoring.
- [ ] Run typecheck, tests, build, accessibility checks, and end-to-end checkout tests.
- [ ] Verify mobile layouts, backups, restore procedure, and incident contact process.
