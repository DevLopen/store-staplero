import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  Heading2, Heading3, List, ListOrdered, Quote, Code, Highlighter,
  Table as TableIcon, Link as LinkIcon, Undo, Redo,
} from "lucide-react";

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
            "min-h-[200px] p-4 text-gray-900 text-sm leading-relaxed focus:outline-none " +
            "prose prose-gray max-w-none prose-p:my-1 prose-headings:text-gray-900",
      },
    },
  });

  if (!editor) return null;

  const ToolBtn = ({
                     onClick, active, children, title,
                   }: {
    onClick: () => void; active?: boolean; children: React.ReactNode; title?: string;
  }) => (
      <button
          type="button"
          onClick={onClick}
          title={title}
          className={`p-1.5 rounded transition-colors ${
              active
                  ? "bg-amber-100 text-amber-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          }`}
      >
        {children}
      </button>
  );

  return (
      <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-0.5 p-2 border-b border-gray-200 bg-gray-50">
          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Pogrubienie">
            <Bold className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Kursywa">
            <Italic className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Podkreślenie">
            <UnderlineIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Przekreślenie">
            <Strikethrough className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Zaznacz">
            <Highlighter className="h-4 w-4" />
          </ToolBtn>

          <span className="w-px bg-gray-200 mx-1 self-stretch" />

          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Nagłówek H2">
            <Heading2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Nagłówek H3">
            <Heading3 className="h-4 w-4" />
          </ToolBtn>

          <span className="w-px bg-gray-200 mx-1 self-stretch" />

          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Do lewej">
            <AlignLeft className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Wyśrodkuj">
            <AlignCenter className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Do prawej">
            <AlignRight className="h-4 w-4" />
          </ToolBtn>

          <span className="w-px bg-gray-200 mx-1 self-stretch" />

          <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista punktowana">
            <List className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerowana">
            <ListOrdered className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Cytat">
            <Quote className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Blok kodu">
            <Code className="h-4 w-4" />
          </ToolBtn>

          <span className="w-px bg-gray-200 mx-1 self-stretch" />

          <ToolBtn
              onClick={() => {
                const url = window.prompt("URL linku:");
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
              active={editor.isActive("link")}
              title="Wstaw link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              title="Wstaw tabelę"
          >
            <TableIcon className="h-4 w-4" />
          </ToolBtn>

          <span className="w-px bg-gray-200 mx-1 self-stretch" />

          <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Cofnij">
            <Undo className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Ponów">
            <Redo className="h-4 w-4" />
          </ToolBtn>
        </div>

        {/* Editor area – white background, dark text */}
        <EditorContent editor={editor} />
      </div>
  );
}