import { Outlet } from "react-router-dom";
import HRNavbar from "../components/HRNavbar/HRNavbar";

const HRLayout = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflowY: "auto",
    }}
  >
    <HRNavbar />
    <div style={{ flex: 1 }}>
      <Outlet />
    </div>
  </div>
);

export default HRLayout;
