"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import "quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export function QuillEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["link", "image"],
          ["clean"],
        ],
      },
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "align",
    "link",
    "image",
  ];

  return (
    <div className="rounded-xl border border-zinc-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-zinc-900/10 focus-within:border-zinc-900">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="min-h-[320px] [&_.ql-editor]:min-h-[280px] [&_.ql-editor]:text-sm [&_.ql-editor]:text-zinc-900 [&_.ql-container]:border-0 [&_.ql-toolbar]:border-zinc-200 [&_.ql-toolbar]:bg-zinc-50"
      />
    </div>
  );
}
