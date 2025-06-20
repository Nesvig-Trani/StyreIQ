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

export default function RichTextEditor({ initialState }: { initialState: string }) {
  const [editorState, setEditorState] = useState<EditorState>()
  const { isLoading, startLoading, stopLoading } = useLoading()
  const router = useRouter()
  const onChange = (editorState: EditorState) => {
    setEditorState(editorState)
  }

  const onSubmit = async () => {
    try {
      if (!editorState) return
      startLoading()
      await savePolicy({ data: editorState?.toJSON() })
      toast.success("Policy saved succesfully")
      router.refresh()
    } catch (e) {
      console.log('error', e)
    } finally {
      stopLoading()
    }
  }

  return (
    <div>
      <div className="mb-2 flex justify-end gap-2">
        <LexicalContentModal triggerButton lexicalData={editorState?.toJSON()} />
        <Button
          onClick={onSubmit}
          disabled={!editorState || isLoading}
          loading={isLoading}
          loadingText="Saving..."
        >
          Save
        </Button>
      </div>

      <LexicalTextEditor initialState={initialState} onChange={onChange} />
    </div>
  )
}
