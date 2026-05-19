export function formatModelName(model: string): string {
  const parts = model.split('/');
  return parts[parts.length - 1] || model;
}

export function getModelColor(
  _model: string,
  modelIndex: number,
  modelColors: readonly string[],
): string {
  return modelColors[modelIndex % modelColors.length] ?? 'text-gray-700 font-semibold';
}
