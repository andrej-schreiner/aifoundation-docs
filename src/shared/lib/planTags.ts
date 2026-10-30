// Fixed wording per plan tag. The colour comes from the plan's key
// (tag.css: .aifs-tag--plan-<key>, tokens aifs.tag.plan.*). Plans without a
// colour of their own (Test, the retired Basic and Standard plans) show the
// standard tag.
export const planTags: Record<string, { label: string }> = {
  essential: { label: 'Essential' },
  professional: { label: 'Professional' },
  agentic: { label: 'Agentic' },
  enterprise: { label: 'Enterprise' },
  test: { label: 'Test' },
};

/** The tag key for a plan name as the data spells it ("Standard 1000" → "standard"). */
export function planTagKey(planName: string): string {
  return planName.trim().split(/\s+/)[0].toLowerCase();
}
