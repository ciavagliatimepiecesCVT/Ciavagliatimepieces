/** True if this option applies to the given function (watch type). Uses for_function_ids; falls back to parent_option_id. */
export function optionAppliesToFunction(
  opt: { parent_option_id?: string | null; for_function_ids?: string[] | null },
  functionId: string
): boolean {
  const ids = opt.for_function_ids ?? (opt.parent_option_id ? [opt.parent_option_id] : []);
  return ids.length === 0 || ids.includes(functionId);
}
