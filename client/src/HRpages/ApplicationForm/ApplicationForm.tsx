// import { useEffect, useRef, useState } from "react";
// import { useSearchParams } from "react-router-dom";
// import axios from "axios";
// import ReactToPrint from "react-to-print";

// const ApplicationForm: React.FC = () => {
//   const [searchParams] = useSearchParams();
//   const userId = searchParams.get("userId");
//   const [profile, setProfile] = useState<any>(null);
//   const printRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (userId) {
//       axios.get(`${import.meta.env.VITE_BACKEND_URL}/get-full-applicant-profile/${userId}`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
//       }).then(res => setProfile(res.data.data));
//     }
//   }, [userId]);

//   if (!profile) return <div>Loading...</div>;

//   return (
//     <div>
//       <ReactToPrint
//         trigger={() => <button>Print / Download PDF</button>}
//         content={() => printRef.current}
//       />
//       <div ref={printRef} style={{ padding: 24, background: "#fff", color: "#000" }}>
//         <h2>Application Form</h2>
//         <h3>Personal Particulars</h3>
//         {/* Render personal particulars fields */}
//         <pre>{JSON.stringify(profile.personal, null, 2)}</pre>
//         <h3>Education Background</h3>
//         <pre>{JSON.stringify(profile.education, null, 2)}</pre>
//         <h3>Work Experience</h3>
//         <pre>{JSON.stringify(profile.work, null, 2)}</pre>
//         <h3>Family Background</h3>
//         <pre>{JSON.stringify(profile.family, null, 2)}</pre>
//         <h3>Supporting Materials</h3>
//         <pre>{JSON.stringify(profile.support, null, 2)}</pre>
//       </div>
//     </div>
//   );
// };

// export default ApplicationForm;