import { Tree } from '@/features/units'

export function filterTreeWithSearch(tree: Tree[], search: string): Tree[] {
  const searchLowerCase = search.toLowerCase()
  return tree
    .map((node) => {
      const matches =
        node.name.toLowerCase().includes(search.toLowerCase()) ||
        (typeof node.admin === 'object' &&
          node.admin?.name?.toLowerCase().includes(searchLowerCase))

      const filteredChildren = filterTreeWithSearch(node.children || [], search)

      if (matches) {
        return {
          ...node,
          children: node.children || [],
        }
      }

      if (filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        }
      }

      return null
    })
    .filter(Boolean) as Tree[]
}
