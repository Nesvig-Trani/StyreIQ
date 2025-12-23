'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $setBlocksType } from '@lexical/selection'
import { $getSelection, $createParagraphNode, $isRangeSelection } from 'lexical'
import { $createHeadingNode } from '@lexical/rich-text'
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  TextFormatType,
  ElementFormatType,
} from 'lexical'
import { TOGGLE_LINK_COMMAND } from '@lexical/link'
import { Button } from '@/shared'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Strikethrough,
  Type,
  Underline,
  Link as LinkIcon,
} from 'lucide-react'
import { useCallback } from 'react'

const Toolbar = () => {
  const [editor] = useLexicalComposerContext()

  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  const formatElement = (format: ElementFormatType) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, format)
  }

  const insertHeading = (level: 1 | 2 | 3) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(`h${level}`))
      }
    })
  }

  const convertToParagraph = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode())
      }
    })
  }

  const insertLink = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) {
      return
    }

    const url = prompt('Enter the URL:')

    if (url !== null) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
    }
  }, [editor])

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b border-gray-200">
      {/* Headers */}
      <Button
        onClick={() => insertHeading(1)}
        className="p-2 bg-gray-100 !text-gray-800 rounded hover:bg-gray-200"
        title="Heading 1"
      >
        <Heading1 />
      </Button>
      <Button
        onClick={() => insertHeading(2)}
        className="p-2 bg-gray-100 !text-gray-800 rounded hover:bg-gray-200"
        title="Heading 2"
      >
        <Heading2 />
      </Button>
      <Button
        onClick={() => insertHeading(3)}
        className="p-2 bg-gray-100 !text-gray-800 rounded hover:bg-gray-200"
        title="Heading 3"
      >
        <Heading3 />
      </Button>
      <Button
        onClick={() => convertToParagraph()}
        className="p-2 bg-gray-100 !text-gray-800 rounded hover:bg-gray-200"
        title="Heading 3"
      >
        <Type />
      </Button>

      {/* Text formatting */}
      <Button
        onClick={() => formatText('bold')}
        className="p-2 bg-gray-100 !text-gray-800 rounded hover:bg-gray-200"
        title="Bold"
      >
        <Bold />
      </Button>
      <Button
        onClick={() => formatText('italic')}
        className="p-2 bg-gray-100 !text-gray-800 rounded hover:bg-gray-200"
        title="Italic"
      >
        <Italic />
      </Button>
      <Button
        onClick={() => formatText('underline')}
        className="p-2 bg-gray-100 !text-gray-800 rounded hover:bg-gray-200"
        title="Underline"
      >
        <Underline />
      </Button>
      <Button
        onClick={() => formatText('strikethrough')}
        className="p-2 bg-gray-100 !text-gray-800 rounded hover:bg-gray-200 line-through"
        title="Strikethrough"
      >
        <Strikethrough />
      </Button>
      <Button
        onClick={insertLink}
        className="p-2 bg-gray-100 !text-gray-800 rounded hover:bg-gray-200"
        title="Insert Link"
      >
        <LinkIcon />
      </Button>
      {/* Alignment */}
      <Button
        onClick={() => formatElement('left')}
        className="p-2 bg-gray-100 !text-gray-800 rounded hover:bg-gray-200"
        title="Align left"
      >
        <AlignLeft />
      </Button>
      <Button
        onClick={() => formatElement('center')}
        className="p-2 bg-gray-100 !text-gray-800 rounded hover:bg-gray-200"
        title="Align center"
      >
        <AlignCenter />
      </Button>
      <Button
        onClick={() => formatElement('right')}
        className="p-2 bg-gray-100 !text-gray-800 rounded hover:bg-gray-200"
        title="Align right"
      >
        <AlignRight />
      </Button>
      <Button
        onClick={() => formatElement('justify')}
        className="p-2 bg-gray-100 !text-gray-800 rounded hover:bg-gray-200"
        title="Justify"
      >
        <AlignJustify />
      </Button>
    </div>
  )
}

export default Toolbar
