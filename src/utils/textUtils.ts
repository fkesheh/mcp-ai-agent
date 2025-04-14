export function toSnakeCase(str?: string) {
  if (!str) return Math.random().toString(36).substring(2, 15);
  return str.toLowerCase().replace(" ", "_");
}
