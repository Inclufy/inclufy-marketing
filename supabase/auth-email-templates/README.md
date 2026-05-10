# Supabase Auth Email Templates — AMOS

Branded HTML voor Supabase Auth flows. Plak per template in:
**Supabase Dashboard → Authentication → Email Templates**

| File | Supabase template | Subject |
|---|---|---|
| `confirm_signup.html` | Confirm signup | Bevestig je email — Inclufy AMOS |
| `magic_link.html` | Magic Link | Inloggen bij Inclufy AMOS |
| `recovery.html` | Reset Password | Wachtwoord opnieuw instellen — Inclufy AMOS |
| `email_change.html` | Change Email Address | Bevestig je nieuwe email-adres — Inclufy AMOS |

## Branding (matcht `marketing.inclufy.com`)

- Primary: `#ED1D96` (magenta-pink)
- Gradient header: `#ED1D96 → #9952E0`
- Font: Roboto
- Logo: `https://marketing.inclufy.com/brand-assets/inclufy-logo-dark-bg.png`
- Radius: 16px

Deze branding is consistent met:
- `inclufy-marketing-web/src/index.css` (CSS-tokens van de webapp)
- `supabase/functions/send-email/index.ts` (transactionele emails)
