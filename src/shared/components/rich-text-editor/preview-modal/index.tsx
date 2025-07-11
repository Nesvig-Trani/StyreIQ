'use client'
import {
  Dialog,
  DialogTrigger,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog'
import { Button } from '@/shared'
import type { JSX } from 'react/jsx-runtime'
import { useRouter } from 'next/navigation'
import { acceptPolicy } from '@/sdk/policies'
import { toast } from 'sonner'
import { useLoading } from '@/shared/hooks'

export interface LexicalData {
  root: LexicalNode
}

interface LexicalNode {
  type: string
  children?: LexicalNode[]
  text?: string
  tag?: string
  format?: number | string
  detail?: number
  mode?: string
  style?: string
  version?: number
  direction?: 'ltr' | 'rtl' | null
  indent?: number
  textFormat?: number
  textStyle?: string
}

function renderLexicalNode(node: LexicalNode, index: number): React.ReactNode {
  if (!node) return

  switch (node.type) {
    case 'root':
      return node.children?.map((child, i) => renderLexicalNode(child, i))
    case 'heading':
      const HeadingTag = (node.tag || 'h1') as keyof JSX.IntrinsicElements
      return (
        <HeadingTag key={index} className="text-2xl font-bold mb-4">
          {node.children?.map((child, i) => renderLexicalNode(child, i))}
        </HeadingTag>
      )
    case 'paragraph':
      let paragraphClass = 'mb-4 text-sm text-muted-foreground leading-relaxed '
      if (typeof node.format === 'string') {
        if (node.format === 'center') paragraphClass += 'text-center'
        if (node.format === 'right') paragraphClass += 'text-right'
        if (node.format === 'left') paragraphClass += 'text-left'
      }
      return (
        <p key={index} className={paragraphClass}>
          {node.children?.length === 0 ? (
            <br />
          ) : (
            node.children?.map((child, i) => renderLexicalNode(child, i))
          )}
        </p>
      )
    case 'text':
      let textClass = ''
      if (typeof node.format === 'number') {
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
    case 'linebreak':
      return <br />
    default:
      return null
  }
}

interface LexicalContentModalProps {
  lexicalData?: LexicalData | null
  title?: string
  description?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showActions?: boolean
  triggerButton?: boolean
  policy?: number
  triggerText?: string
}

export function LexicalContentModal({
  lexicalData,
  title = 'Policy Preview',
  open,
  onOpenChange,
  showActions = false,
  triggerButton = true,
  policy,
  triggerText = 'Preview',
}: LexicalContentModalProps) {
  const { isLoading, startLoading, stopLoading } = useLoading()
  const router = useRouter()
  const onAccept = async () => {
    try {
      if (!policy) return
      startLoading()
      await acceptPolicy({ policy })
      toast.success('You have accepted the new policy')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      stopLoading()
    }
  }
  const onReject = () => {
    toast.error('You must accept the policies to access the system')
    router.push('/api/logout')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerButton && (
        <DialogTrigger asChild>
          <Button variant="secondary" disabled={!lexicalData}>
            {triggerText}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="w-full  min-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">{lexicalData?.root && renderLexicalNode(lexicalData.root, 0)}</div>
        {showActions && (
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={onReject}>
              Cancel and Log Out
            </Button>
            <Button onClick={onAccept} loading={isLoading} disabled={isLoading}>
              Accept and Continue
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
