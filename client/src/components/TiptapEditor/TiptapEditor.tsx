import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import styles from './TiptapEditor.module.css';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: content || '',
    editorProps: {
      attributes: {
        class: styles.proseMirror,
        'data-placeholder': placeholder || 'Start typing...',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return (
      <div className={styles.editorContainer}>
        <div className={styles.toolbar}>
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading editor...</span>
        </div>
        <div className={styles.editorContent}>
          <div style={{ padding: '16px', minHeight: '120px' }}>
            <textarea
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              style={{
                width: '100%',
                minHeight: '88px',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.6',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editorContainer}>
      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${styles.toolbarBtn} ${editor.isActive('bold') ? styles.active : ''}`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${styles.toolbarBtn} ${editor.isActive('italic') ? styles.active : ''}`}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${styles.toolbarBtn} ${editor.isActive('underline') ? styles.active : ''}`}
          title="Underline"
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>
        <div className={styles.divider} />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${styles.toolbarBtn} ${editor.isActive('bulletList') ? styles.active : ''}`}
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${styles.toolbarBtn} ${editor.isActive('orderedList') ? styles.active : ''}`}
          title="Ordered List"
        >
          1.
        </button>
        <div className={styles.divider} />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className={styles.toolbarBtn}
          title="Undo"
          disabled={!editor.can().undo()}
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className={styles.toolbarBtn}
          title="Redo"
          disabled={!editor.can().redo()}
        >
          ↷
        </button>
      </div>
      <div className={styles.editorContent}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;