import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import "./JobRequisition.css";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Undo2,
  Redo2,
} from "lucide-react";

const TiptapEditor = ({
  content,
  onChange,
  isDark,
}: {
  content: string;
  onChange: (value: string) => void;
  isDark: boolean;
}) => {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content,
    editorProps: {
      attributes: {
        class: `tiptap-editor ${isDark ? "dark-tiptap" : "light-tiptap"}`,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
      <div className="editor-wrapper">
        <div className="tiptap-toolbar">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "is-active" : ""}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "is-active" : ""}
            title="Italic"
          >
            <Italic size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive("underline") ? "is-active" : ""}
            title="Underline"
          >
            <UnderlineIcon size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "is-active" : ""}
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "is-active" : ""}
            title="Ordered List"
          >
            <ListOrdered size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            <Undo2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            <Redo2 size={18} />
          </button>
        </div>
        <EditorContent editor={editor} />
      </div>

  );
};

const JobRequisition: React.FC = () => {
  const [mode, setMode] = useState("post");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");

  const isDark = document.body.classList.contains("dark");

  return (
    <div className="post-job-container">

      <div className="post-job-panel">
        <h2 className="panel-title">
          {mode === "post" ? "Post a Job" : "Edit Current Job"}
        </h2>

        <div className="toggle-buttons">
          <button
            className={mode === "post" ? "active" : ""}
            onClick={() => setMode("post")}
          >
            Post a Job
          </button>
          <button
            className={mode === "edit" ? "active" : ""}
            onClick={() => setMode("edit")}
          >
            Edit Current Job
          </button>
        </div>
        <form
          className="post-job-form"
          onSubmit={(e) => {
            e.preventDefault();
            console.log({ responsibilities, requirements });
            alert("Form submitted!");
          }}
        >
          <div className="form-grid">
            <div className="form-column">
              <label>Job Title</label>
              <input type="text" placeholder="Enter job title" required />

              <label>Job Category</label>
              <select required>
                <option value="">Select category</option>
                <option value="manager">Manager / Executive</option>
                <option value="lecturer">Lecturer</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div className="form-column">
              <label>No. of Job Seekers Required</label>
              <input type="number" min="1" placeholder="e.g. 2" required />

              <label>Job Type</label>
              <select required>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
          </div>

          <label>Job Responsibilities</label>
          <TiptapEditor
            content={responsibilities}
            onChange={setResponsibilities}
            isDark={isDark}
          />

          <label>Job Requirements</label>
          <TiptapEditor
            content={requirements}
            onChange={setRequirements}
            isDark={isDark}
          />

          <button type="submit" className="submit-btn">
            {mode === "post" ? "Post Job" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JobRequisition;
