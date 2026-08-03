/**
 * Normalize list responses from the backend.
 *
 * Different backend endpoints return lists in different shapes:
 *   { data: [...] }
 *   { agents: [...], data: { agents: [...] } }
 *   { clients: [...], data: { clients: [...] } }
 *
 * This helper safely extracts the array regardless of shape, so frontend
 * code never calls .map/.filter on a non-array (which previously crashed
 * the whole admin layout with "d.filter is not a function").
 */
export function normalizeList(res, key) {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.data)) return res.data
  if (key && Array.isArray(res[key])) return res[key]
  if (key && Array.isArray(res.data?.[key])) return res.data[key]
  return []
}
