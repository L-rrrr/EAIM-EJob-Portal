import { Outlet, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import HRSidebar from "../components/HRSidebar/HRSidebar";
import axios from "axios";

const HRProfileLayout = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [applicantName, setApplicantName] = useState<string>("");

  useEffect(() => {
    const fetchApplicantName = async () => {
      if (!userId) return;
      
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/get-applicant-data/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.success && response.data.data.personalParticulars) {
          setApplicantName(response.data.data.personalParticulars.full_name || "Unknown Applicant");
        }
      } catch (error) {
        console.error("Failed to fetch applicant name:", error);
        setApplicantName("Unknown Applicant");
      }
    };

    fetchApplicantName();
  }, [userId]);

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "92vh", overflowY: "auto" }}>
      <HRSidebar applicantName={applicantName} />
      <div style={{ flex: 1, padding: "0px", overflowY: "auto" }}>
        <Outlet />
      </div>
    </div>
  );
};

export default HRProfileLayout;