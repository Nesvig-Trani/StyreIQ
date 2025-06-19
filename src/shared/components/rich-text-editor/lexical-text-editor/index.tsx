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

export default function LexicalTextEditor({
  onChange,
  initialState,
}: {
  onChange: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void
  initialState: string
}) {
  const initialConfig = {
    editorState: initialState,
    namespace: 'MyEditor',
    theme,
    onError,
    nodes: [HeadingNode, ListNode, ListItemNode, LinkNode, TableNode, TableCellNode, TableRowNode],
  }
  return (
    <div>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <Toolbar />
          <div className="relative">
            <RichTextPlugin
              contentEditable={<ContentEditable className="min-h-[200px] p-4 focus:outline-none" />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <OnChangePlugin onChange={onChange} />
          </div>
        </div>
      </LexicalComposer>
    </div>
  )
}
