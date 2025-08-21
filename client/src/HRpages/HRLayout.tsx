/**
 * HRLayout Component
 *
 * This layout component provides a consistent structure for all HR pages.
 * It includes the HR navigation bar at the top and renders the current route's content below.
 *
 * Features:
 * - Displays the HRNavbar at the top of every HR page.
 * - Uses React Router's <Outlet> to render nested HR routes.
 * - Applies a flex column layout to fill the viewport height.
 *
 * Usage:
 * - Used as a parent layout for all HR-related routes.
 *
 * @component
 */

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
