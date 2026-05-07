// Maps a product / campaign keyword → preferred LinkedIn company page name.
// Used by the publish flow once LMDP is approved and `social_accounts` rows exist
// for each admin-managed organization. The matcher runs against
// `social_account.account_name` (which the OAuth callback sets to
// `${organization.localizedName} (Bedrijf)`).
//
// To add/move a mapping: just edit this map. No DB migration needed.

export const LINKEDIN_PAGE_BY_PRODUCT: Record<string, string> = {
  // Academy / learning content
  academy:        'Inclufy Academy',
  assessments:    'Inclufy Academy',

  // ProjeXtPal — projects/field
  projects:       'ProjextPal',
  projextpal:     'ProjextPal',

  // AMOS — events/marketing/social
  marketing:      'AMOS',
  amos:           'AMOS',
  events:         'AMOS',

  // IQ Helix — assessments/AI competence
  helix:          'Inclufy-AI',
  'iq-helix':     'Inclufy-AI',
  iqhelix:        'Inclufy-AI',

  // ERP / Operations / Finance modules → AI Solutions umbrella
  finance:        'Inclufy AI Solutions',
  sales:          'Inclufy AI Solutions',
  procurement:    'Inclufy AI Solutions',
  inventory:      'Inclufy AI Solutions',
  warehousing:    'Inclufy AI Solutions',
  manufacturing:  'Inclufy AI Solutions',
  logistics:      'Inclufy AI Solutions',
  ignite:         'Inclufy AI Solutions',
  erp:            'Inclufy AI Solutions',

  // Ecosystem / cross-product launch posts
  ecosystem:              'Inclufy Consulting',
  'ecosystem-platform':   'Inclufy Consulting',
  'ecosystem-7producten': 'Inclufy Consulting',
  consulting:             'Inclufy Consulting',

  // Thought leadership / community
  community:      'LEADERS NETWORK',
  leadership:     'LEADERS NETWORK',
};

/**
 * Given a campaign string and/or external_id (e.g. "ecosystem-finance-bold"),
 * extract the product key and return the preferred LinkedIn page name.
 * Returns null if no match — caller falls back to smart-default (first company).
 */
export function preferredLinkedInPageFor(
  campaign?: string | null,
  externalId?: string | null,
): string | null {
  const haystacks = [externalId, campaign]
    .filter(Boolean)
    .map((s) => (s as string).toLowerCase());

  for (const h of haystacks) {
    // Try direct key match (longest first to avoid 'helix' matching before 'iq-helix')
    const sortedKeys = Object.keys(LINKEDIN_PAGE_BY_PRODUCT).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (h.includes(key)) return LINKEDIN_PAGE_BY_PRODUCT[key];
    }
  }
  return null;
}
