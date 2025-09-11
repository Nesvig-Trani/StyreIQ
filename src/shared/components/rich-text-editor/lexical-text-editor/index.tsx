import type { EditorState, LexicalEditor } from 'lexical'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import Toolbar from '../toolbar'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { HeadingNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode } from '@lexical/link'
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table'
import { LockKeyholeIcon } from 'lucide-react'

const theme = {
  heading: {
    h1: 'text-3xl font-bold my-4',
    h2: 'text-2xl font-bold my-3',
    h3: 'text-xl font-bold my-2',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
  },
  paragraph: 'my-2',
}

function onError(error: Error) {
  console.error(error)
}

interface LexicalTextEditorProps {
  initialState: string
  onChange: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void
  readOnly?: boolean
}

export default function LexicalTextEditor({
  initialState,
  onChange,
  readOnly = false,
}: LexicalTextEditorProps) {
  const initialConfig = {
    editorState: initialState,
    namespace: 'MyEditor',
    theme,
    onError,
    nodes: [HeadingNode, ListNode, ListItemNode, LinkNode, TableNode, TableCellNode, TableRowNode],
    editable: !readOnly,
  }

  const placeholder = readOnly ? 'Read-only content...' : 'Write your policy here...'

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className={`relative ${readOnly ? 'opacity-75' : ''}`}>
          <Toolbar />
          {readOnly && (
            <div className="absolute inset-0 bg-gray-50/50 z-10 pointer-events-none rounded-md" />
          )}

          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={`min-h-[200px] p-4 focus:outline-none ${
                  readOnly ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />

          {!readOnly && (
            <>
              <HistoryPlugin />
              <ListPlugin />
              <OnChangePlugin onChange={onChange} />
            </>
          )}
        </div>
      </div>

      {readOnly && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <LockKeyholeIcon />
          Read-only mode - Only the Super Admin can edit
        </p>
      )}
    </LexicalComposer>
  )
}
