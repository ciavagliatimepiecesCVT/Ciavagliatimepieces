/** True when stored JSON is a public configurator preset (non-empty steps). Matches getProductConfiguratorConfig. */
export function hasPublicConfiguratorPreset(configurator_config: unknown): boolean {
  if (configurator_config == null || typeof configurator_config !== "object") return false;
  const config = configurator_config as Record<string, unknown>;
  const steps = Array.isArray(config.steps) ? config.steps : undefined;
  return (steps?.length ?? 0) > 0;
}
