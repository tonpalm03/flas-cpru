"use client";

import { useEffect, useReducer, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Paragraph from "@tiptap/extension-paragraph";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Pilcrow,
  Redo2,
  Underline as UnderlineIcon,
  Undo2
} from "lucide-react";
import { INDENT_STEP_MM, MAX_INDENT_LEVEL, sanitizeBodyHtml } from "@/lib/richBody";

/** ย่อหน้าเนื้อหา: เก็บระดับเยื้องซ้ายและการเยื้องบรรทัดแรก 2.5 ซม. เพิ่มจากข้อความ */
const BodyParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      indent: {
        default: 0,
        parseHTML: (el: HTMLElement) => Math.min(MAX_INDENT_LEVEL, Number(el.getAttribute("data-indent") || 0)),
        renderHTML: (attrs: Record<string, unknown>) => (Number(attrs.indent) > 0 ? { "data-indent": String(attrs.indent) } : {})
      },
      firstLine: {
        default: true,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-first") !== "0",
        renderHTML: (attrs: Record<string, unknown>) => (attrs.firstLine ? {} : { "data-first": "0" })
      }
    };
  }
});

interface RichBodyEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // ป้องกันโฟกัสหลุดจากตัวแก้ไขเมื่อกดปุ่ม
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      className={
        "w-8 h-8 inline-flex items-center justify-center rounded-lg border text-slate-700 transition-colors disabled:opacity-40 " +
        (active ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-slate-200 hover:bg-slate-50")
      }
    >
      {children}
    </button>
  );
}

export default function RichBodyEditor({ value, onChange, placeholder, minHeight = 260 }: RichBodyEditorProps) {
  const lastEmitted = useRef<string>(sanitizeBodyHtml(value));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: false
      }),
      BodyParagraph,
      Placeholder.configure({ placeholder: placeholder || "" }),
      TextAlign.configure({
        types: ["paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "justify"
      })
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "rich-body-content",
        spellcheck: "false"
      }
    },
    onUpdate: ({ editor: ed }) => {
      const clean = sanitizeBodyHtml(ed.getHTML());
      lastEmitted.current = clean;
      onChange(clean);
    }
  });

  // รับค่าจากภายนอก (แม่แบบต้นฉบับ) โดยไม่วนซ้ำกับค่าที่ตัวแก้ไขส่งออกเอง
  useEffect(() => {
    if (!editor) return;
    const incoming = sanitizeBodyHtml(value);
    if (incoming !== lastEmitted.current) {
      lastEmitted.current = incoming;
      editor.commands.setContent(incoming || "", { emitUpdate: false });
    }
  }, [value, editor]);

  // แถบเครื่องมือต้องวาดใหม่ทุกครั้งที่เคอร์เซอร์/เนื้อหาเปลี่ยน เพื่อให้สถานะปุ่มตรงกับตำแหน่งปัจจุบัน
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!editor) return;
    editor.on("transaction", rerender);
    return () => {
      editor.off("transaction", rerender);
    };
  }, [editor]);

  const attrs = (editor?.getAttributes("paragraph") ?? {}) as { indent?: number; firstLine?: boolean; textAlign?: string };
  const state = editor
    ? {
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        underline: editor.isActive("underline"),
        align: attrs.textAlign || "justify",
        indent: Number(attrs.indent || 0),
        firstLine: attrs.firstLine !== false,
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo()
      }
    : null;

  if (!editor || !state) {
    return <div className="rounded-xl border border-slate-200 bg-slate-50 animate-pulse" style={{ minHeight }} />;
  }

  const chain = () => editor.chain().focus();
  const setIndent = (level: number) =>
    chain().updateAttributes("paragraph", { indent: Math.max(0, Math.min(MAX_INDENT_LEVEL, level)) }).run();

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-900/20">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-slate-200 bg-slate-50">
        <ToolButton label="ตัวหนา" active={state.bold} onClick={() => chain().toggleBold().run()}>
          <Bold className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="ตัวเอียง" active={state.italic} onClick={() => chain().toggleItalic().run()}>
          <Italic className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="ขีดเส้นใต้" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
          <UnderlineIcon className="w-4 h-4" />
        </ToolButton>
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <ToolButton label="จัดชิดซ้าย" active={state.align === "left"} onClick={() => chain().setTextAlign("left").run()}>
          <AlignLeft className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="จัดกึ่งกลาง" active={state.align === "center"} onClick={() => chain().setTextAlign("center").run()}>
          <AlignCenter className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="จัดชิดขวา" active={state.align === "right"} onClick={() => chain().setTextAlign("right").run()}>
          <AlignRight className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="กระจายสองขอบ" active={state.align === "justify"} onClick={() => chain().setTextAlign("justify").run()}>
          <AlignJustify className="w-4 h-4" />
        </ToolButton>
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <ToolButton label="เพิ่มการเยื้องซ้าย" disabled={state.indent >= MAX_INDENT_LEVEL} onClick={() => setIndent(state.indent + 1)}>
          <IndentIncrease className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="ลดการเยื้องซ้าย" disabled={state.indent <= 0} onClick={() => setIndent(state.indent - 1)}>
          <IndentDecrease className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          label="เยื้องบรรทัดแรก ๒.๕ ซม. (เปิด/ปิด)"
          active={state.firstLine}
          onClick={() => chain().updateAttributes("paragraph", { firstLine: !state.firstLine }).run()}
        >
          <Pilcrow className="w-4 h-4" />
        </ToolButton>
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <ToolButton label="เลิกทำ" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
          <Undo2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="ทำซ้ำ" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
          <Redo2 className="w-4 h-4" />
        </ToolButton>
        <span className="ml-auto text-[11px] text-slate-500 hidden sm:inline">
          Enter = ย่อหน้าใหม่ / Shift+Enter = ขึ้นบรรทัดใหม่
        </span>
      </div>
      <div style={{ minHeight }} className="px-4 py-3 bg-white">
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .rich-body-content {
          outline: none;
          min-height: ${minHeight - 24}px;
          font-family: 'TH SarabunPSK', 'Sarabun', sans-serif;
          font-size: 16pt;
          line-height: 1.35;
          color: #000;
        }
        .rich-body-content p {
          margin: 0 0 6px 0;
          text-indent: 25mm;
          text-align: justify;
          min-height: 1.35em;
        }
        .rich-body-content p[data-first="0"] { text-indent: 0; }
        ${Array.from({ length: MAX_INDENT_LEVEL }, (_, i) =>
          `.rich-body-content p[data-indent="${i + 1}"] { margin-left: ${(i + 1) * INDENT_STEP_MM}mm; }`
        ).join("\n")}
        .rich-body-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          height: 0;
          color: #94a3b8;
          pointer-events: none;
          white-space: pre-line;
          text-indent: 0;
        }
      `}</style>
    </div>
  );
}
