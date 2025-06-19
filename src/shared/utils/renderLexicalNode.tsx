

function renderLexicalNode(node: LexicalNode, index: number): React.ReactNode {
  if (!node) return null

  switch (node.type) {
    case 'root':
      return node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))
    case 'heading':
      const HeadingTag = (node.tag || 'h1') as keyof JSX.IntrinsicElements
      return (
        <HeadingTag key={index} className="text-2xl font-bold mb-4">
          {node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))}
        </HeadingTag>
      )

    case 'paragraph':
      if (!node.children || node.children.length === 0) {
        return null
      }
      return (
        <p key={index} className="mb-4 text-sm text-muted-foreground leading-relaxed">
          {node.children?.map((child, childIndex) => renderLexicalNode(child, childIndex))}
        </p>
      )

    case 'text':
      let textClass = ''

      if (node.format) {
        if (node.format & 1) textClass += ' font-bold'
        if (node.format & 2) textClass += ' italic'
        if (node.format & 4) textClass += ' line-through'
        if (node.format & 8) textClass += ' underline'
      }

      return (
        <span key={index} className={textClass}>
          {node.text}
        </span>
      )

    default:
      return null
  }
}
