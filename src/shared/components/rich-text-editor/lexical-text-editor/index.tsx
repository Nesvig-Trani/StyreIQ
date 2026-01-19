import type { EditorState, LexicalEditor } from 'lexical'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin'
import Toolbar from '../toolbar'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { HeadingNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table'
import { LockKeyholeIcon } from 'lucide-react'

const DEFAULT_EMPTY_STATE = JSON.stringify({
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})

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
  link: 'text-blue-600 underline hover:text-blue-800 cursor-pointer',
}

function onError(error: Error) {
  console.error(error)
}

const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/

const EMAIL_MATCHER =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/

const MATCHERS = [
  (text: string) => {
    const match = URL_MATCHER.exec(text)
    if (match === null) {
      return null
    }
    const fullMatch = match[0]
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
      attributes: { rel: 'noopener noreferrer', target: '_blank' },
    }
  },
  (text: string) => {
    const match = EMAIL_MATCHER.exec(text)
    if (match === null) {
      return null
    }
    const fullMatch = match[0]
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: `mailto:${fullMatch}`,
    }
  },
]

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
  const sanitizedInitialState = (() => {
    if (!initialState || initialState.trim() === '') {
      return DEFAULT_EMPTY_STATE
    }

    try {
      const parsed = JSON.parse(initialState)

      if (!parsed.root || typeof parsed.root !== 'object') {
        return DEFAULT_EMPTY_STATE
      }

      return initialState
    } catch (error) {
      console.warn('[LexicalTextEditor] Failed to parse initialState, using default:', error)
      return DEFAULT_EMPTY_STATE
    }
  })()

  const initialConfig = {
    editorState: sanitizedInitialState,
    namespace: 'MyEditor',
    theme,
    onError,
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      TableNode,
      TableCellNode,
      TableRowNode,
    ],
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
              <LinkPlugin />
              <AutoLinkPlugin matchers={MATCHERS} />
              <OnChangePlugin onChange={onChange} />
            </>
          )}
        </div>
      </div>

      {readOnly && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <LockKeyholeIcon className="h-3 w-3" />
          Read-only mode – Only Super Admins and Central Admins can edit policies
        </p>
      )}
    </LexicalComposer>
  )
}
