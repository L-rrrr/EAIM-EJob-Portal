/**
 * ManagerLayout Component
 *
 * This layout component provides a consistent structure for all manager pages.
 * It includes the ManagerNavbar at the top and renders the current route's content below.
 *
 * Features:
 * - Displays the ManagerNavbar at the top of every manager page.
 * - Uses React Router's <Outlet> to render nested manager routes.
 * - Applies a flex column layout to fill the viewport height.
 *
 * Usage:
 * - Used as a parent layout for all manager-related routes.
 *
 * @component
 */

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
