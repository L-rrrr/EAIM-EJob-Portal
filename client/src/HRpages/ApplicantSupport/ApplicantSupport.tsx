import { useState } from "react";
import { Trash2 } from "lucide-react";

const ApplicantSupport: React.FC = () => {
  const [showReferences, setShowReferences] = useState(true);
  const [showAttachments, setShowAttachments] = useState(true);

  const [references, setReferences] = useState([
    { id: 1, name: "", occupation: "", contactNo: "", relationship: "" },
    { id: 2, name: "", occupation: "", contactNo: "", relationship: "" },
  ]);

  const [attachments, setAttachments] = useState([
    { id: 1, documentType: "Resume", documentName: "", file: null }
  ]);

  const deleteReference = (id: number) => {
    if (references.length > 2) {
      setReferences(references.filter(ref => ref.id !== id));
    }
  };

  const updateReference = (id: number, field: string, value: string) => {
    setReferences(references.map(ref =>
      ref.id === id ? { ...ref, [field]: value } : ref
    ));
  };

  const deleteAttachment = (id: number) => {
    if (attachments.length > 1) {
      setAttachments(attachments.filter(att => att.id !== id));
    }
  };

  const updateAttachment = (id: number, field: string, value: string | File | null) => {
    setAttachments(attachments.map(att =>
      att.id === id ? { ...att, [field]: value } : att
    ));
  };

  return (
    <div className="main-panel">
      <div className="form-wrapper">

        {/* References Section */}
        <div className="form-container">
          <h2 className="section-title" onClick={() => setShowReferences(prev => !prev)}>
            References
          </h2>
          {showReferences && (
            <div>
              {references.map((ref, index) => (
                <div key={ref.id} className={`form-section ${index >= 2 ? "record" : ""}`}>
                  {index >= 2 && (
                    <div className="delete-btn" onClick={() => deleteReference(ref.id)}>
                      <Trash2 size={16} />
                    </div>
                  )}

                  <div>
                    <span className="label-text">Referee Name<span className="required-asterisk">*</span></span>
                    <input
                      type="text"
                      className="input"
                      value={ref.name}
                      onChange={(e) => updateReference(ref.id, 'name', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Occupation<span className="required-asterisk">*</span></span>
                    <input
                      type="text"
                      className="input"
                      value={ref.occupation}
                      onChange={(e) => updateReference(ref.id, 'occupation', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Contact No.<span className="required-asterisk">*</span></span>
                    <input
                      type="text"
                      className="input"
                      value={ref.contactNo}
                      onChange={(e) => updateReference(ref.id, 'contactNo', e.target.value)}
                    />
                  </div>

                  <div>
                    <span className="label-text">Relationship<span className="required-asterisk">*</span></span>
                    <input
                      type="text"
                      className="input"
                      value={ref.relationship}
                      onChange={(e) => updateReference(ref.id, 'relationship', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attachments Section */}
        <div className="form-container">
          <h2 className="section-title" onClick={() => setShowAttachments(prev => !prev)}>
            Attachments
          </h2>
          {showAttachments && (
            <div>
              {attachments.map((att, index) => (
                <div key={att.id} className={`form-section ${index > 0 ? "record" : ""}`}>
                  {index > 0 && (
                    <div className="delete-btn" onClick={() => deleteAttachment(att.id)}>
                      <Trash2 size={16} />
                    </div>
                  )}

                  
                    <div className="attachment-type">
                      <span className="label-text">
                        Document Type<span className="required-asterisk">*</span>
                      </span>

                      {index === 0 ? (
                        <input
                          type="text"
                          className="input"
                          value="Resume"
                          disabled
                        />
                      ) : (
                        <select
                          className="input"
                          value={att.documentType}
                          onChange={(e) => updateAttachment(att.id, 'documentType', e.target.value)}
                        >
                          <option value="">-- Select Document Type --</option>
                          <option value="Cover Letter">Cover Letter</option>
                          <option value="Certificate">Certificate</option>
                          <option value="Photo">Photo</option>
                          <option value="Passport">Passport</option>
                          <option value="Others">Others</option>
                        </select>
                      )}
                    </div>


                    <div className="attachment-name">
                      <span className="label-text">Document Name<span className="required-asterisk">*</span></span>
                      <input
                        type="text"
                        className="input"
                        value={att.documentName}
                        onChange={(e) => updateAttachment(att.id, 'documentName', e.target.value)}
                      />
                    </div>

                    <div className="attachment-upload">
                      <span className="label-text invisible">Browse...</span>
                      <input
                        type="file"
                        onChange={(e) => updateAttachment(att.id, 'file', e.target.files?.[0] || null)}
                      />
                    </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantSupport;
