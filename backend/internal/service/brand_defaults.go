package service

import "strings"

const (
	defaultSiteName     = "VeloRoute"
	defaultSiteLogo     = "/logo.svg"
	defaultSiteSubtitle = "High-speed AI Routing Gateway"

	legacySiteName     = "Sub2API"
	legacySiteSubtitle = "Subscription to API Conversion Platform"
)

func normalizeBrandSiteName(value string) string {
	value = strings.TrimSpace(value)
	if value == "" || value == legacySiteName {
		return defaultSiteName
	}
	return value
}

func normalizeBrandSiteLogo(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return defaultSiteLogo
	}
	return value
}

func normalizeBrandSiteSubtitle(value string) string {
	value = strings.TrimSpace(value)
	if value == "" || value == legacySiteSubtitle {
		return defaultSiteSubtitle
	}
	return value
}
