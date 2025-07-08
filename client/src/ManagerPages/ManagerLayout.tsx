import { Outlet } from "react-router-dom";
import Navbar from "../components/ManagerNavbar/ManagerNavbar";

const ManagerLayout = () => (
  <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto" }}>
    <Navbar />
    <div style={{ flex: 1, }}>
      <Outlet />
    </div>
  </div>
);

export default ManagerLayout;
