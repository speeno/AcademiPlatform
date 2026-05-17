'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import 'react-quill-new/dist/quill.snow.css';

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
  const [QuillComp, setQuillComp] = useState<any>(null);
  const quillRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const maxImageBytes = maxImageSizeMb * 1024 * 1024;

  useEffect(() => {
    let active = true;
    (async () => {
      const mod = await import('react-quill-new');
      if (active) setQuillComp(() => mod.default);
    })();
    return () => { active = false; };
  }, []);

  const imageHandler = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageFile = useCallback(
    (file: File | null) => {
      if (!file) return;
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
        const editor = quillRef.current?.getEditor?.();
        if (editor) {
          const range = editor.getSelection(true);
          editor.insertEmbed(range.index, 'image', result);
          editor.setSelection(range.index + 1);
        }
      };
      reader.onerror = () => toast.error('이미지 읽기에 실패했습니다.');
      reader.readAsDataURL(file);
    },
    [maxImageBytes, maxImageSizeMb],
  );

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['link', 'image'],
          ['blockquote', 'code-block'],
          ['clean'],
        ],
        handlers: { image: imageHandler },
      },
    }),
    [imageHandler],
  );

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'align',
    'link', 'image',
    'blockquote', 'code-block',
  ];

  if (!QuillComp) {
    return (
      <div className="min-h-[320px] w-full rounded-lg border px-3 py-2 text-sm text-muted-foreground flex items-center justify-center">
        에디터 로딩 중...
      </div>
    );
  }

  const Quill = QuillComp;

  return (
    <div className="quill-editor-wrapper">
      <Quill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder="내용을 입력하세요..."
        style={{ minHeight: '320px' }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleImageFile(e.target.files?.[0] ?? null);
          e.currentTarget.value = '';
        }}
      />
      <p className="text-xs text-muted-foreground mt-1">
        이미지는 HTML 내부 base64로 저장됩니다. (최대 {maxImageSizeMb}MB)
      </p>
    </div>
  );
}
