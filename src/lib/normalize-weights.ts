export function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const sum = Object.values(weights).reduce((acc, val) => acc + val, 0)
  if (sum === 0) return weights

  const normalized: Record<string, number> = {}
  for (const [key, value] of Object.entries(weights)) {
    normalized[key] = value / sum
  }
  return normalized
}
