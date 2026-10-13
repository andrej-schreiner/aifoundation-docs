// Display-only cloud labels, keyed by exactModelName.
//
// A model's cloud is normally derived from its single `deploymentRegion`, but
// the Service Description (§ 2.3.2 and § 7.2) lists the Anthropic models
// as running on "Google Cloud Platform & Microsoft Azure" — the request may be
// served from either. The region field cannot express that, so these labels
// override the rendered text only. Filtering, sorting and tag colours keep
// using the region-derived cloud key, so a model stays findable under the cloud
// its region names.
const CLOUD_LABEL_OVERRIDES: Record<string, string> = {
  'claude-haiku-4.5': 'GCP / Azure',
  'claude-sonnet-4.6': 'GCP / Azure',
  'claude-opus-4.6': 'GCP / Azure',
  'claude-opus-4.8': 'GCP / Azure',
  'claude-sonnet-5': 'GCP / Azure',
  'claude-opus-5': 'GCP / Azure',
  'claude-fable-5': 'GCP / Azure',
  'claude-sonnet-5.5': 'GCP / Azure',
  'claude-opus-5.5': 'GCP / Azure',
};

/** Cloud label to render for a model, falling back to the region-derived one. */
export function cloudLabelFor(exactModelName: string | undefined, derived: string): string {
  return (exactModelName && CLOUD_LABEL_OVERRIDES[exactModelName]) || derived;
}

/** Full name for a tooltip, spelling out both providers where both apply. */
export function cloudFullNameFor(exactModelName: string | undefined, derived: string): string {
  return exactModelName && CLOUD_LABEL_OVERRIDES[exactModelName]
    ? 'Google Cloud Platform & Microsoft Azure'
    : derived;
}
