export const DEFAULT_SITE_NAME = 'VeloRoute'
export const DEFAULT_SITE_LOGO = '/logo.svg'
export const DEFAULT_SITE_SUBTITLE = 'High-speed AI Routing Gateway'
export const DEFAULT_TITLE_SUFFIX = 'AI Routing Gateway'

const LEGACY_SITE_NAME = 'Sub2API'
const LEGACY_SITE_SUBTITLE = 'Subscription to API Conversion Platform'

export function resolveBrandSiteName(siteName?: string): string {
  const normalized = siteName?.trim() ?? ''
  return !normalized || normalized === LEGACY_SITE_NAME ? DEFAULT_SITE_NAME : normalized
}

export function resolveBrandSiteLogo(siteLogo?: string): string {
  return siteLogo?.trim() || DEFAULT_SITE_LOGO
}

export function resolveBrandSiteSubtitle(siteSubtitle?: string): string {
  const normalized = siteSubtitle?.trim() ?? ''
  return !normalized || normalized === LEGACY_SITE_SUBTITLE ? DEFAULT_SITE_SUBTITLE : normalized
}
