'use client'
import { useState } from 'react'
import type { EditorState, LexicalEditor, SerializedEditorState } from 'lexical'
import { LexicalContentModal } from './preview-modal'
import LexicalTextEditor from './lexical-text-editor'
import { Button } from '../ui/button'
import { savePolicy } from '@/sdk/policies'

export default function RichTextEditor({ initialState }: { initialState: string }) {
  const [editorState, setEditorState] = useState<EditorState>()

  const onChange = (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => {
    setEditorState(editorState)
  }

  const onSubmit = async () => {
    try {
      if (!editorState) return
      await savePolicy({ data: editorState?.toJSON() })
    } catch (e) {
      console.log('error', e)
    }
  }

  return (
    <div>
      <div className="mb-2 flex justify-end gap-2">
        <LexicalContentModal triggerButton lexicalData={editorState?.toJSON()} />
        <Button onClick={onSubmit} disabled={!editorState}>
          Save
        </Button>
      </div>

      <LexicalTextEditor initialState={initialState} onChange={onChange} />
    </div>
  )
}
