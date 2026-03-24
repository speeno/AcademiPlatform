'use client';

import { useEffect, useMemo, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { BrandButton } from '@/components/ui/brand-button';
import { toast } from 'sonner';

type Props = {
  value: string;
  onChange: (html: string) => void;
  maxImageSizeMb?: number;
};

export function HtmlWysiwygEditor({
  value,
  onChange,
  maxImageSizeMb = 2,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const maxImageBytes = useMemo(() => maxImageSizeMb * 1024 * 1024, [maxImageSizeMb]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        inline: false,
      }),
    ],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class:
          'min-h-[320px] w-full rounded-lg border px-3 py-2 text-sm focus:outline-none',
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href ?? '';
    const nextUrl = window.prompt('링크 URL 입력', previousUrl);
    if (nextUrl === null) return;
    const url = nextUrl.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const requestImagePick = () => {
    fileInputRef.current?.click();
  };

  const insertBase64Image = (file: File | null) => {
    if (!editor || !file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 삽입할 수 있습니다.');
      return;
    }
    if (file.size > maxImageBytes) {
      toast.error(`이미지는 ${maxImageSizeMb}MB 이하만 허용됩니다.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result.startsWith('data:image/')) {
        toast.error('이미지 변환에 실패했습니다.');
        return;
      }
      editor.chain().focus().setImage({ src: result }).run();
    };
    reader.onerror = () => {
      toast.error('이미지 읽기에 실패했습니다.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <BrandButton
          size="sm"
          variant="outline"
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          B
        </BrandButton>
        <BrandButton
          size="sm"
          variant="outline"
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          I
        </BrandButton>
        <BrandButton
          size="sm"
          variant="outline"
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </BrandButton>
        <BrandButton
          size="sm"
          variant="outline"
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          목록
        </BrandButton>
        <BrandButton size="sm" variant="outline" type="button" onClick={setLink}>
          링크
        </BrandButton>
        <BrandButton size="sm" variant="outline" type="button" onClick={requestImagePick}>
          이미지(base64)
        </BrandButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          insertBase64Image(e.target.files?.[0] ?? null);
          e.currentTarget.value = '';
        }}
      />

      <EditorContent editor={editor} />
      <p className="text-xs text-gray-500">
        이미지는 HTML 내부 base64로 저장됩니다. (최대 {maxImageSizeMb}MB)
      </p>
    </div>
  );
}

