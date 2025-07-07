import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";

const ProfileLayout = () => (
  <div style={{ display: "flex", flexDirection: "row", height: "91vh", overflowY: "hidden" }}>
  <Sidebar />
    <div style={{ flex: 1, padding: "0px", overflowY: "auto" }}>
      <Outlet />
    </div>
  </div>
);

export default ProfileLayout;
