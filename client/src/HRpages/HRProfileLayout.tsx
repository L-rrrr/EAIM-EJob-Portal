import { Outlet } from "react-router-dom";
import Sidebar from "../components/HRSidebar/HRSidebar";

const HRProfileLayout = () => (
  <div style={{ display: "flex", flexDirection: "row", height: "92vh", overflowY: "auto" }}>
  <Sidebar />
    <div style={{ flex: 1, padding: "0px", overflowY: "auto" }}>
      <Outlet />
    </div>
  </div>
);

export default HRProfileLayout;
