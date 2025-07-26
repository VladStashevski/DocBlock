import * as React from "react"
import { EditorContent, EditorContext, useEditor, type Editor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import { TextSelection } from "prosemirror-state"
import { EditorView } from "prosemirror-view"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsMobile } from "@/hooks/use-mobile"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink } from "docx"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import content from "@/components/tiptap-templates/simple/data/content.json"

const parseHtmlToDocx = (html: string) => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  function parseInlineNode(node: Node): (TextRun | ExternalHyperlink)[] {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      return text.trim() ? [new TextRun({ text, font: "Times New Roman" })] : [];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    const el = node as HTMLElement;
    switch (el.tagName.toLowerCase()) {
      case "strong":
      case "b":
        return [new TextRun({ text: el.textContent || "", bold: true, font: "Times New Roman" })];
      case "em":
      case "i":
        return [new TextRun({ text: el.textContent || "", italics: true, font: "Times New Roman" })];
      case "u":
        return [new TextRun({ text: el.textContent || "", underline: {}, font: "Times New Roman" })];
      case "s":
      case "strike":
        return [new TextRun({ text: el.textContent || "", strike: true, font: "Times New Roman" })];
      case "sup":
        return [new TextRun({ text: el.textContent || "", superScript: true, font: "Times New Roman" })];
      case "sub":
        return [new TextRun({ text: el.textContent || "", subScript: true, font: "Times New Roman" })];
      case "mark":
        return [new TextRun({ text: el.textContent || "", highlight: "yellow", font: "Times New Roman" })];
      case "a": {
        const href = el.getAttribute("href") || undefined;
        if (href) {
          return [new ExternalHyperlink({ children: [new TextRun({ text: el.textContent || "", font: "Times New Roman" })], link: href })];
        }
        return [new TextRun({ text: el.textContent || "", font: "Times New Roman" })];
      }
      case "img":
        return [new TextRun({ text: "[Image]", font: "Times New Roman" })];
      default:
        // Рекурсивно собираем все инлайн-дети
        return Array.from(el.childNodes).flatMap(parseInlineNode);
    }
  }

  function parseBlockNode(node: Node): Paragraph[] {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      return text.trim() ? [new Paragraph({ children: [new TextRun({ text, font: "Times New Roman" })] })] : [];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    const el = node as HTMLElement;
    switch (el.tagName.toLowerCase()) {
      case "h1":
        return [new Paragraph({ children: parseInlineNode(el), heading: HeadingLevel.TITLE })];
      case "h2":
        return [new Paragraph({ children: parseInlineNode(el), heading: HeadingLevel.HEADING_1 })];
      case "h3":
        return [new Paragraph({ children: parseInlineNode(el), heading: HeadingLevel.HEADING_2 })];
      case "h4":
        return [new Paragraph({ children: parseInlineNode(el), heading: HeadingLevel.HEADING_3 })];
      case "h5":
        return [new Paragraph({ children: parseInlineNode(el), heading: HeadingLevel.HEADING_4 })];
      case "h6":
        return [new Paragraph({ children: parseInlineNode(el), heading: HeadingLevel.HEADING_5 })];
      case "p":
        return [new Paragraph({ children: parseInlineNode(el) })];
      case "blockquote":
        return [new Paragraph({ children: parseInlineNode(el), style: "IntenseQuote" })];
      case "pre":
      case "code":
        return [new Paragraph({ children: parseInlineNode(el), style: "Code" })];
      case "ul":
        return Array.from(el.children).flatMap(li => [new Paragraph({ children: parseInlineNode(li), bullet: { level: 0 } })]);
      case "ol":
        return Array.from(el.children).flatMap(li => [new Paragraph({ children: parseInlineNode(li), numbering: { reference: "numbered-list", level: 0 } })]);
      case "li":
        return [new Paragraph({ children: parseInlineNode(el) })];
      case "hr":
        return [new Paragraph({})];
      default:
        // Рекурсивно собираем все блочные дети
        return Array.from(el.childNodes).flatMap(parseBlockNode);
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "numbered-list",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: "left",
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: parseBlockNode(tempDiv),
      },
    ],
  });
  return doc;
};

const exportToWord = (editor: Editor | null) => {
  if (!editor) return;
  const html = editor.getHTML();
  const doc = parseHtmlToDocx(html);
  Packer.toBlob(doc).then((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.docx";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  });
};

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  editor,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
  editor: Editor | null
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <Button onClick={() => exportToWord(editor)} title="Экспорт в Word">
          <LinkIcon className="tiptap-button-icon" /> Word
        </Button>
      </ToolbarGroup>
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

interface SimpleEditorProps {
  initialContent?: string
  onContentChange?: (content: string) => void
  onFocusRequest?: () => void
}

export function SimpleEditor({ 
  initialContent,
  onContentChange,
  onFocusRequest
}: SimpleEditorProps = {}) {
  const isMobile = useIsMobile()
  const windowSize = useWindowSize()
  const [mobileView, setMobileView] = React.useState<
    "main" | "highlighter" | "link"
  >("main")
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
      handleDrop: (view: EditorView, event: DragEvent) => {
        try {
          if (!event.dataTransfer) return false
          
          const jsonData = event.dataTransfer.getData('application/json')
          if (jsonData) {
            const block = JSON.parse(jsonData)
            if (block.content) {
              const { tr } = view.state
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
              
              // Проверяем валидность позиции
              if (pos === undefined || pos < 0 || pos > view.state.doc.content.size) {
                return false
              }

              // Получаем текстовое содержимое блока
              const tempDiv = document.createElement('div')
              tempDiv.innerHTML = block.content
              const textContent = tempDiv.textContent || tempDiv.innerText || ''
              
              if (!textContent.trim()) return false
              
              const contentToInsert = textContent.trim()
              
              // Проверяем, есть ли выделенный текст
              const { selection } = view.state
              const hasSelection = !selection.empty
              
              if (hasSelection) {
                // Если есть выделение, заменяем его содержимым блока
                tr.replaceWith(selection.from, selection.to, view.state.schema.text(contentToInsert))
                view.dispatch(tr)
                
                // Устанавливаем курсор после замененного контента
                const newPos = selection.from + contentToInsert.length
                const newSelection = TextSelection.create(view.state.doc, newPos)
                view.dispatch(view.state.tr.setSelection(newSelection))
              } else {
                // Если выделения нет, вставляем в позицию курсора
                tr.insertText(contentToInsert, pos)
                view.dispatch(tr)
                
                // Устанавливаем курсор после вставленного контента
                const newPos = pos + contentToInsert.length
                const newSelection = TextSelection.create(view.state.doc, newPos)
                view.dispatch(view.state.tr.setSelection(newSelection))
              }
              
              // Фокусируем редактор
              view.focus()
              return true
            }
          }
          return false
        } catch (error) {
          console.error('Error handling drop:', error)
          return false
        }
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content: initialContent || content,
    onUpdate: ({ editor }) => {
      if (onContentChange) {
        onContentChange(editor.getHTML())
      }
    },
  })

  const bodyRect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  // Обновляем контент редактора при изменении initialContent
  React.useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentContent = editor.getHTML()
      if (currentContent !== initialContent) {
        editor.commands.setContent(initialContent)
      }
    }
  }, [editor, initialContent])

  // Фокусируем редактор при запросе
  React.useEffect(() => {
    if (onFocusRequest && editor) {
      editor.commands.focus()
    }
  }, [onFocusRequest, editor])

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={
            isMobile
              ? {
                  bottom: `calc(100% - ${windowSize.height - bodyRect.y}px)`,
                }
              : {}
          }
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
              editor={editor}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  )
}
