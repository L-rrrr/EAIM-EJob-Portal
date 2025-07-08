import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import axios from "axios";
import styles from "../Education/Education.module.css"; 
import supportStyles from "./Support.module.css";

const Support: React.FC = () => {
  const [showReferences, setShowReferences] = useState(true);
  const [showAttachments, setShowAttachments] = useState(true);
  const navigate = useNavigate();

  // Type definitions
  type ReferenceRecord = {
    id: number;
    reference_id?: number;
    name: string;
    occupation: string;
    contactNo: string;
    relationship: string;
  };

  type AttachmentRecord = {
    id: number;
    attachment_id?: number;
    documentType: string;
    documentName: string;
    file: File | null;
    file_name?: string;
    file_path?: string;
    file_size?: number;
    file_type?: string;
  };

  type ValidationErrors = {
    [recordId: number]: {
      [field: string]: string; // error message
    };
  };

  // State with first 2 records being compulsory
  const [references, setReferences] = useState<ReferenceRecord[]>([
    { id: 1, reference_id: undefined, name: "", occupation: "", contactNo: "", relationship: "" },
    { id: 2, reference_id: undefined, name: "", occupation: "", contactNo: "", relationship: "" },
  ]);

  const [attachments, setAttachments] = useState<AttachmentRecord[]>([
    { id: 1, attachment_id: undefined, documentType: "Resume", documentName: "", file: null }
  ]);

  const [referenceValidationErrors, setReferenceValidationErrors] = useState<ValidationErrors>({});
  const [attachmentValidationErrors, setAttachmentValidationErrors] = useState<ValidationErrors>({});

  // Mapping function for backend
  const mapReferenceToBackend = (record: ReferenceRecord) => ({
    reference_id: record.reference_id,
    name: record.name,
    occupation: record.occupation,
    contact_no: record.contactNo,
    relationship: record.relationship,
  });


  // Fetch references from backend
  const fetchReferences = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-references`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const records = res.data.data.map((rec: any, index: number) => ({
          id: index + 1, // Use sequential IDs for frontend
          reference_id: rec.reference_id,
          name: rec.name || "",
          occupation: rec.occupation || "",
          contactNo: rec.contact_no || "",
          relationship: rec.relationship || "",
        }));
        
        // Ensure we always have at least 2 records for references
        while (records.length < 2) {
          records.push({
            id: records.length + 1,
            reference_id: undefined,
            name: "",
            occupation: "",
            contactNo: "",
            relationship: "",
          });
        }
        
        setReferences(records);
      }
    } catch (error) {
      console.error("Failed to fetch references", error);
    }
  };

  // Fetch attachments from backend
  const fetchAttachments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-attachments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const records = res.data.data.map((rec: any, index: number) => ({
          id: index + 1,
          attachment_id: rec.attachment_id,
          documentType: rec.document_type || "",
          documentName: rec.document_name || "",
          file: null, // File objects don't come from backend
          file_name: rec.file_name || "",
          file_path: rec.file_path || "",
          file_size: rec.file_size || 0,
          file_type: rec.file_type || "",
        }));
        
        // Ensure we always have at least 1 record (Resume)
        while (records.length < 1) {
          records.push({
            id: records.length + 1,
            attachment_id: undefined,
            documentType: records.length === 0 ? "Resume" : "",
            documentName: "",
            file: null,
          });
        }
        
        setAttachments(records);
      }
    } catch (error) {
      console.error("Failed to fetch attachments", error);
    }
  };

  useEffect(() => {
    fetchReferences();
    fetchAttachments();
  }, []);

  // Add file size validation function
  const validateFileSize = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    return file.size <= maxSize;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Add file upload function
  const uploadFile = async (file: File): Promise<any> => {
    // Double-check file size before upload
    if (!validateFileSize(file)) {
      throw new Error(`File "${file.name}" exceeds the maximum size limit of 10MB. File size: ${formatFileSize(file.size)}`);
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/upload-file`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message);
    } catch (error: any) {
      console.error("File upload failed:", error);
      
      // Handle specific multer errors
      if (error.response?.data?.error?.includes('File too large')) {
        throw new Error(`File "${file.name}" is too large. Maximum file size allowed is 10MB.`);
      } else if (error.response?.data?.error?.includes('Only images, PDFs, and documents are allowed')) {
        throw new Error(`File type not allowed for "${file.name}". Only images, PDFs, and documents (doc, docx, txt, xls, xlsx) are allowed.`);
      }
      
      throw error;
    }
  };

  // Validation function
  const validateRecords = (): boolean => {
    const referenceErrors: ValidationErrors = {};
    const attachmentErrors: ValidationErrors = {};

    // Validate References
    references.forEach((record) => {
      const recordErrors: { [field: string]: string } = {};

      if (!record.name || !record.name.trim()) {
        recordErrors.name = "Required";
      }
      if (!record.occupation || !record.occupation.trim()) {
        recordErrors.occupation = "Required";
      }
      if (!record.contactNo || !record.contactNo.trim()) {
        recordErrors.contactNo = "Required";
      }
      if (!record.relationship || !record.relationship.trim()) {
        recordErrors.relationship = "Required";
      }

      if (Object.keys(recordErrors).length > 0) {
        referenceErrors[record.id] = recordErrors;
      }
    });

    // Validate Attachments
    attachments.forEach((record) => {
      const recordErrors: { [field: string]: string } = {};

      if (record.id === 1) {
        // First record (Resume) is required
        if (!record.documentName || !record.documentName.trim()) {
          recordErrors.documentName = "Required";
        }
        if (!record.file && !record.file_path) {
          recordErrors.file = "Resume file is required";
        }
      } else {
        // Other records are optional but if added must be complete
        if (!record.documentType || !record.documentType.trim()) {
          recordErrors.documentType = "Required";
        }
        if (!record.documentName || !record.documentName.trim()) {
          recordErrors.documentName = "Required";
        }
        if (!record.file && !record.file_path) {
          recordErrors.file = "File is required";
        }
      }

      if (Object.keys(recordErrors).length > 0) {
        attachmentErrors[record.id] = recordErrors;
      }
    });

    setReferenceValidationErrors(referenceErrors);
    setAttachmentValidationErrors(attachmentErrors);
    
    return Object.keys(referenceErrors).length === 0 && Object.keys(attachmentErrors).length === 0;
  };

  // Save as Draft function
  // Update handleSaveDraft function
  const handleSaveDraft = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      // Check file sizes before attempting upload
      for (const attachment of attachments) {
        if (attachment.file && !validateFileSize(attachment.file)) {
          alert(`Cannot save draft: File "${attachment.file.name}" exceeds the 10MB size limit. File size: ${formatFileSize(attachment.file.size)}`);
          return;
        }
      }
      
      // Upload files first for attachments that have new files
      const attachmentsToSave = [];
      for (const attachment of attachments) {
        let fileInfo = null;
        
        if (attachment.file) {
          try {
            fileInfo = await uploadFile(attachment.file);
          } catch (error: any) {
            // Show specific error message
            alert(`Failed to upload file: ${error.message || error}`);
            return;
          }
        }

        // CHANGED: Include ALL attachments, not just those with document_type or document_name
        // For drafts, we want to save even incomplete records
        attachmentsToSave.push({
          attachment_id: attachment.attachment_id,
          document_type: attachment.documentType,
          document_name: attachment.documentName,
          file_name: fileInfo?.file_name || attachment.file_name,
          file_path: fileInfo?.file_path || attachment.file_path,
          file_size: fileInfo?.file_size || attachment.file_size,
          file_type: fileInfo?.file_type || attachment.file_type,
        });
      }

      // Save both references and attachments
      const promises = [
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-references`,
          { referenceRecords: references.map(mapReferenceToBackend), is_draft: "Y" },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-attachments`,
          { attachmentRecords: attachmentsToSave, is_draft: "Y" }, // CHANGED: Remove filter, save all
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ];

      const responses = await Promise.all(promises);

      // Update states with backend IDs
      if (responses[0].data.success && responses[0].data.data) {
        const updatedRecords = references.map((frontendRecord, index) => ({
          ...frontendRecord,
          reference_id: responses[0].data.data[index].reference_id
        }));
        setReferences(updatedRecords);
      }

      if (responses[1].data.success && responses[1].data.data) {
        const updatedAttachments = attachments.map((frontendRecord, index) => {
          if (index < responses[1].data.data.length) {
            return {
              ...frontendRecord,
              attachment_id: responses[1].data.data[index].attachment_id,
              file_name: responses[1].data.data[index].file_name,
              file_path: responses[1].data.data[index].file_path,
              file_size: responses[1].data.data[index].file_size,
              file_type: responses[1].data.data[index].file_type,
              file: null, // Clear file after successful upload
            };
          }
          return frontendRecord;
        });
        setAttachments(updatedAttachments);
      }

      alert("Draft saved!");
    } catch (error: any) {
      console.error("Save draft error:", error);
      if (error.response?.data?.message) {
        alert(`Failed to save draft: ${error.response.data.message}`);
      } else {
        alert("Failed to save draft.");
      }
    }
  };

  // Update function
  const handleUpdate = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    const isValid = validateRecords();
    if (!isValid) {
      alert("Please fill in all required fields before updating.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      // Check file sizes before attempting upload
      for (const attachment of attachments) {
        if (attachment.file && !validateFileSize(attachment.file)) {
          alert(`Cannot update: File "${attachment.file.name}" exceeds the 10MB size limit. File size: ${formatFileSize(attachment.file.size)}`);
          return;
        }
      }
      
      // Upload files first for attachments that have new files
      const attachmentsToSave = [];
      for (const attachment of attachments) {
        let fileInfo = null;
        
        if (attachment.file) {
          try {
            fileInfo = await uploadFile(attachment.file);
          } catch (error: any) {
            // Show specific error message
            alert(`Failed to upload file: ${error.message || error}`);
            return;
          }
        }

        // Only include attachments that have meaningful data
        if (attachment.documentType || attachment.documentName || fileInfo || attachment.file_path) {
          attachmentsToSave.push({
            attachment_id: attachment.attachment_id,
            document_type: attachment.documentType,
            document_name: attachment.documentName,
            file_name: fileInfo?.file_name || attachment.file_name,
            file_path: fileInfo?.file_path || attachment.file_path,
            file_size: fileInfo?.file_size || attachment.file_size,
            file_type: fileInfo?.file_type || attachment.file_type,
          });
        }
      }

      // Save both references and attachments
      const promises = [
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/save-references`,
          { referenceRecords: references.map(mapReferenceToBackend), is_draft: "N" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ];

      // Only save attachments if we have some
      if (attachmentsToSave.length > 0) {
        promises.push(
          axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/save-attachments`,
            { attachmentRecords: attachmentsToSave, is_draft: "N" },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );
      }

      const responses = await Promise.all(promises);

      // Update states with backend IDs
      if (responses[0].data.success && responses[0].data.data) {
        const updatedRecords = references.map((frontendRecord, index) => ({
          ...frontendRecord,
          reference_id: responses[0].data.data[index].reference_id
        }));
        setReferences(updatedRecords);
      }

      if (responses.length > 1 && responses[1].data.success && responses[1].data.data) {
        const updatedAttachments = attachments.map((frontendRecord, index) => {
          if (index < responses[1].data.data.length) {
            return {
              ...frontendRecord,
              attachment_id: responses[1].data.data[index].attachment_id,
              file_name: responses[1].data.data[index].file_name,
              file_path: responses[1].data.data[index].file_path,
              file_size: responses[1].data.data[index].file_size,
              file_type: responses[1].data.data[index].file_type,
              file: null, // Clear file after successful upload
            };
          }
          return frontendRecord;
        });
        setAttachments(updatedAttachments);
      }

      alert("Records updated!");
    } catch (error: any) {
      console.error("Update error:", error);
      if (error.response?.data?.message) {
        alert(`Failed to update records: ${error.response.data.message}`);
      } else {
        alert("Failed to update records.");
      }
    }
  };

  // Add reference function
  const addReference = () => {
    // Generate ID based on existing records or start from next available
    const newId = references.length > 0 ? Math.max(...references.map(r => r.id)) + 1 : 1;
    setReferences([
      ...references,
      {
        id: newId,
        reference_id: undefined,
        name: "",
        occupation: "",
        contactNo: "",
        relationship: "",
      }
    ]);
  };

  // Delete reference function
  const deleteReference = async (id: number) => {
    const recordToDelete = references.find(record => record.id === id);
    
    // Don't allow deletion of first 2 records (they are required)
    if (id <= 2) {
      alert("The first two reference records cannot be deleted as they are required.");
      return;
    }
    
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this reference record? This action cannot be undone."
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      // If the record has a reference_id (exists in database), delete from backend
      if (recordToDelete?.reference_id) {
        const token = localStorage.getItem("token");
        
        const response = await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/delete-references`,
          {
            headers: { Authorization: `Bearer ${token}` },
            data: { reference_id: recordToDelete.reference_id }
          }
        );

        if (response.data.success) {
          console.log("Reference record deleted from database successfully");
        }
      }
      
      // Remove from frontend state
      setReferences(references.filter(record => record.id !== id));
      
      // Clear any validation errors for this record
      if (referenceValidationErrors[id]) {
        setReferenceValidationErrors((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      }
            
    } catch (error) {
      console.error("Failed to delete reference record:", error);
      alert("Failed to delete record from database, but removed from form.");
      
      // Still remove from frontend even if backend delete fails
      setReferences(references.filter(record => record.id !== id));
      
      // Clear validation errors
      if (referenceValidationErrors[id]) {
        setReferenceValidationErrors((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      }
    }
  };

  // Update reference function (like updateScholarshipAward)
  const updateReference = (id: number, field: string, value: string) => {
    setReferences(references.map(ref =>
      ref.id === id ? { ...ref, [field]: value } : ref
    ));

    // Clear validation error when user starts typing
    if (referenceValidationErrors[id]?.[field] && value.trim() !== "") {
      setReferenceValidationErrors((prev) => {
        const updated = { ...prev };
        if (updated[id]) {
          delete updated[id][field];
          // If no more errors for this record, remove the record key entirely
          if (Object.keys(updated[id]).length === 0) {
            delete updated[id];
          }
        }
        return updated;
      });
    }
  };

  // Keep existing attachment functions unchanged
  const addAttachment = () => {
    const newId = Math.max(...attachments.map(a => a.id)) + 1;
    setAttachments([
      ...attachments,
      { id: newId, documentType: "", documentName: "", file: null }
    ]);
  };

  const deleteAttachment = async (id: number) => {
    const recordToDelete = attachments.find(record => record.id === id);
    
    console.log("=== FRONTEND DELETE DEBUG ===");
    console.log("Deleting attachment with frontend ID:", id);
    console.log("Record to delete:", recordToDelete);
    
    // Don't allow deletion of first record (Resume)
    if (id === 1) {
      alert("The resume attachment cannot be deleted as it is required.");
      return;
    }
    
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this attachment? This will delete both the database record and the physical file permanently."
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      // If the record has an attachment_id (exists in database), delete from backend
      if (recordToDelete?.attachment_id) {
        const token = localStorage.getItem("token");
        
        console.log("Sending delete request with attachment_id:", recordToDelete.attachment_id);
        
        const response = await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/delete-attachments`,
          {
            headers: { Authorization: `Bearer ${token}` },
            data: { attachment_id: recordToDelete.attachment_id }
          }
        );

        console.log("Delete response:", response.data);

        if (response.data.success) {
          console.log("✅ Attachment deleted successfully:", response.data);
          
          // Show detailed feedback if available
          if (response.data.details) {
            console.log("Deletion details:", response.data.details);
            alert(`Attachment deleted successfully!\nDatabase: ${response.data.details.database}\nFile: ${response.data.details.file}`);
          } else {
            alert("Attachment deleted successfully!");
          }
        }
      } else {
        console.log("Record has no attachment_id, only removing from frontend");
      }
      
      // Remove from frontend state
      setAttachments(attachments.filter(record => record.id !== id));
      
      // Clear any validation errors for this record
      if (attachmentValidationErrors[id]) {
        setAttachmentValidationErrors((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      }
      
    } catch (error: any) {
      console.error("❌ Failed to delete attachment:", error);
      console.error("Error details:", error.response?.data);
      
      // More specific error messages
      if (error.response?.data?.message) {
        alert(`Failed to delete attachment: ${error.response.data.message}`);
      } else {
        alert("Failed to delete attachment from database, but removed from form.");
      }
      
      // Still remove from frontend even if backend delete fails
      setAttachments(attachments.filter(record => record.id !== id));
      
      // Clear validation errors
      if (attachmentValidationErrors[id]) {
        setAttachmentValidationErrors((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      }
    }
    
    console.log("=== FRONTEND DELETE COMPLETE ===");
  };

  // Update attachment update function
  const updateAttachment = async (id: number, field: string, value: string | File | null, event?: React.ChangeEvent<HTMLInputElement>) => {
    // If it's a file upload, validate file size first
    if (field === 'file' && value instanceof File) {
      if (!validateFileSize(value)) {
        alert(`File "${value.name}" is too large. Maximum file size is 10MB. Your file is ${formatFileSize(value.size)}.`);
        
        // Clear the specific file input that triggered this event
        if (event?.target) {
          event.target.value = '';
        }
        
        return; // Don't update state - file is rejected
      }

      // Check if there's already a file for this attachment
      const currentAttachment = attachments.find(att => att.id === id);
      if (currentAttachment?.file_path && currentAttachment?.attachment_id) {
        // There's already a file saved in database, we need to replace it
        const confirmReplace = window.confirm(
          `This will replace the existing file "${currentAttachment.file_name}". Do you want to continue?`
        );
        
        if (!confirmReplace) {
          // User cancelled, clear the file input
          if (event?.target) {
            event.target.value = '';
          }
          return;
        }

        try {
          // Delete the old file first
          const token = localStorage.getItem("token");
          await axios.delete(
            `${import.meta.env.VITE_BACKEND_URL}/replace-attachment-file`,
            {
              headers: { Authorization: `Bearer ${token}` },
              data: { 
                attachment_id: currentAttachment.attachment_id,
                old_file_path: currentAttachment.file_path
              }
            }
          );
          
          console.log("Old file deleted successfully");
        } catch (error) {
          console.error("Failed to delete old file:", error);
          alert("Warning: Could not delete the old file, but will proceed with upload.");
        }
      }
    }

    // Update the state
    setAttachments(attachments.map(att =>
      att.id === id ? { ...att, [field]: value } : att
    ));

    // Clear validation error when user updates
    if (attachmentValidationErrors[id]?.[field] && 
        ((typeof value === 'string' && value.trim() !== "") || 
        (value instanceof File))) {
      setAttachmentValidationErrors((prev) => {
        const updated = { ...prev };
        if (updated[id]) {
          delete updated[id][field];
          if (Object.keys(updated[id]).length === 0) {
            delete updated[id];
          }
        }
        return updated;
      });
    }
  };

  return (
    <div className={styles.mainPanel}>
      <div className={styles.formWrapper}>

        {/* References Section */}
        <div className={styles.formContainer}>
          <h2
            className={supportStyles.sectionTitle}
            onClick={() => setShowReferences(prev => !prev)}
          >
            <span className={styles.sectionTitleText}>
              References
            </span>
            <div className={styles.sectionArrow}>
              {showReferences ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>
          {showReferences && (
            <div>
              <div className={styles.labelHint}>
                Please provide at least 2 references. The first 2 references are required.
              </div>

              {references.map((ref, index) => (
                <div key={ref.id} className={`${styles.formSection} ${index >= 2 ? styles.record : ""}`}>
                  {index >= 2 && (
                    <div className={styles.deleteBtn} onClick={() => deleteReference(ref.id)}>
                      <Trash2 size={16} />
                    </div>
                  )}

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Referee Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={ref.name}
                      onChange={(e) => updateReference(ref.id, 'name', e.target.value)}
                      style={{
                        borderColor: referenceValidationErrors[ref.id]?.name ? "red" : undefined,
                      }}
                    />
                    {referenceValidationErrors[ref.id]?.name && (
                      <div className={styles.errorMessage}>
                        {referenceValidationErrors[ref.id].name}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Occupation<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={ref.occupation}
                      onChange={(e) => updateReference(ref.id, 'occupation', e.target.value)}
                      style={{
                        borderColor: referenceValidationErrors[ref.id]?.occupation ? "red" : undefined,
                      }}
                    />
                    {referenceValidationErrors[ref.id]?.occupation && (
                      <div className={styles.errorMessage}>
                        {referenceValidationErrors[ref.id].occupation}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Contact No.<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={ref.contactNo}
                      onChange={(e) => updateReference(ref.id, 'contactNo', e.target.value)}
                      style={{
                        borderColor: referenceValidationErrors[ref.id]?.contactNo ? "red" : undefined,
                      }}
                    />
                    {referenceValidationErrors[ref.id]?.contactNo && (
                      <div className={styles.errorMessage}>
                        {referenceValidationErrors[ref.id].contactNo}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Relationship<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={ref.relationship}
                      onChange={(e) => updateReference(ref.id, 'relationship', e.target.value)}
                      style={{
                        borderColor: referenceValidationErrors[ref.id]?.relationship ? "red" : undefined,
                      }}
                    />
                    {referenceValidationErrors[ref.id]?.relationship && (
                      <div className={styles.errorMessage}>
                        {referenceValidationErrors[ref.id].relationship}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className={styles.addRecordContainer}>
                <button onClick={addReference} className={styles.addRecordBtn}>
                  Add Referee
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Attachments Section */}
        <div className={styles.formContainer}>
          <h2
            className={supportStyles.sectionTitle}
            onClick={() => setShowAttachments(prev => !prev)}
          >
            <span className={styles.sectionTitleText}>
              Attachments
            </span>
            <div className={styles.sectionArrow}>
              {showAttachments ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </h2>
          {showAttachments && (
            <div>
              <div className={styles.labelHint}>
                Resume is compulsory. You can add more attachments if needed.
              </div>

              {attachments.map((att, index) => (
                <div key={att.id} className={`${styles.formSection} ${index > 0 ? styles.record : ""}`}>
                  {index > 0 && (
                    <div className={styles.deleteBtn} onClick={() => deleteAttachment(att.id)}>
                      <Trash2 size={16} />
                    </div>
                  )}

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Document Type<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    {index === 0 ? (
                      <input
                        type="text"
                        className={styles.input}
                        value="Resume"
                        disabled
                      />
                    ) : (
                      <select
                        className={styles.input}
                        value={att.documentType}
                        onChange={(e) => updateAttachment(att.id, 'documentType', e.target.value)}
                        style={{
                          borderColor: attachmentValidationErrors[att.id]?.documentType ? "red" : undefined,
                        }}
                      >
                        <option value="">-- Select Document Type --</option>
                        <option value="Resume">Resume</option>
                        <option value="Cover Letter">Cover Letter</option>
                        <option value="Certificate">Certificate</option>
                        <option value="Photo">Photo</option>
                        <option value="Passport">Passport</option>
                        <option value="Others">Others</option>
                      </select>
                    )}
                    {attachmentValidationErrors[att.id]?.documentType && (
                      <div className={styles.errorMessage}>
                        {attachmentValidationErrors[att.id].documentType}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Document Name<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="text"
                      className={styles.input}
                      value={att.documentName}
                      onChange={(e) => updateAttachment(att.id, 'documentName', e.target.value)}
                      style={{
                        borderColor: attachmentValidationErrors[att.id]?.documentName ? "red" : undefined,
                      }}
                    />
                    {attachmentValidationErrors[att.id]?.documentName && (
                      <div className={styles.errorMessage}>
                        {attachmentValidationErrors[att.id].documentName}
                      </div>
                    )}
                  </div>

                  <div className={styles.inputGroup}>
                    <span className={styles.labelText}>
                      Browse... (Max 10MB)<span className={styles.requiredAsterisk}>*</span>
                    </span>
                    <input
                      type="file"
                      className={styles.input}
                      onChange={(e) => updateAttachment(att.id, 'file', e.target.files?.[0] || null, e)}
                      style={{
                        borderColor: attachmentValidationErrors[att.id]?.file ? "red" : undefined,
                      }}
                    />

                    <div className={supportStyles.fileHint}>
                      Accepted formats: JPEG, JPG, PNG, GIF, PDF, DOC, DOCX, TXT, XLS, XLSX (Max: 10MB)
                    </div>

                    {attachmentValidationErrors[att.id]?.file && (
                      <div className={styles.errorMessage}>
                        {attachmentValidationErrors[att.id].file}
                      </div>
                    )}
                    {att.file_name && (
                      <div style={{ fontSize: "0.85rem", marginTop: "0.25rem", color: "green" }}>
                        Current file: {att.file_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className={styles.addRecordContainer}>
                <button onClick={addAttachment} className={styles.addRecordBtn}>
                  Add Attachment
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.formButtons}>
          <button className={`${styles.btn} ${styles.save}`} onClick={handleSaveDraft}>Save as draft</button>
          <button className={`${styles.btn} ${styles.save}`} onClick={handleUpdate}>Update</button>
        </div>
      </div>
    </div>
  );
};

export default Support;
