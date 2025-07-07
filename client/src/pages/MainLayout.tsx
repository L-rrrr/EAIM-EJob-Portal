import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";

const MainLayout = () => (
  <div style={{ display: "flex", flexDirection: "column", height: "auto", overflowY: "hidden" }}>
    <Navbar />
    <div style={{ flex: 1 }}>
      <Outlet />
    </div>
  </div>
);

export default MainLayout;
