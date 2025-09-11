'use client'
import { useState } from 'react'
import type { EditorState } from 'lexical'
import { LexicalContentModal } from './preview-modal'
import LexicalTextEditor from './lexical-text-editor'
import { Button } from '@/shared'
import { savePolicy } from '@/sdk/policies'
import { useLoading } from '@/shared/hooks'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface RichTextEditorProps {
  initialState: string
  isSuperAdmin?: boolean
}

export default function RichTextEditor({
  initialState,
  isSuperAdmin = false,
}: RichTextEditorProps) {
  const [editorState, setEditorState] = useState<EditorState>()
  const { isLoading, startLoading, stopLoading } = useLoading()
  const router = useRouter()
  const onChange = (editorState: EditorState) => {
    setEditorState(editorState)
  }

  const onSubmit = async () => {
    try {
      if (!editorState) return
      if (!isSuperAdmin) {
        toast.error('You do not have permission to save policies')
        return
      }

      startLoading()
      await savePolicy({ data: editorState?.toJSON() })
      toast.success('Policy saved successfully')
      router.refresh()
    } catch (e) {
      console.log('error', e)
    } finally {
      stopLoading()
    }
  }

  return (
    <div>
      <LexicalTextEditor initialState={initialState} onChange={onChange} readOnly={!isSuperAdmin} />
      <div className="mt-4 flex justify-end gap-2">
        <LexicalContentModal triggerButton lexicalData={editorState?.toJSON()} />
        {isSuperAdmin ? (
          <Button
            onClick={onSubmit}
            disabled={!editorState || isLoading}
            loading={isLoading}
            loadingText="Saving..."
          >
            Save
          </Button>
        ) : (
          <Button
            disabled
            className="opacity-50 cursor-not-allowed"
            title="Only the Super Admin can save policies"
          >
            Save
          </Button>
        )}
      </div>
    </div>
  )
}
