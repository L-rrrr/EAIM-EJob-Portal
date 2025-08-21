/**
 * MainLayout Component
 *
 * This layout component provides a consistent structure for all main pages.
 * It includes the main Navbar at the top and renders the current route's content below.
 *
 * Features:
 * - Displays the Navbar at the top of every main page.
 * - Uses React Router's <Outlet> to render nested routes.
 * - Applies a flex column layout to fill the viewport height.
 *
 * Usage:
 * - Used as a parent layout for all main (non-HR, non-Manager) routes.
 *
 * @component
 */

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
