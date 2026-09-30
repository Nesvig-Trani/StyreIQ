export const hasSameValues = (a: (string | number)[], b: (string | number)[]): boolean => {
  const setA = new Set(a.map(String))
  const setB = new Set(b.map(String))
  return setA.size === setB.size && [...setA].every((value) => setB.has(value))
}
