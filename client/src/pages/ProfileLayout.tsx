/**
 * ProfileLayout Component
 *
 * This layout component provides a sidebar and content area for all profile-related pages.
 * It displays the Sidebar on the left and renders the current route's content on the right.
 *
 * Features:
 * - Displays the Sidebar component for profile navigation.
 * - Uses React Router's <Outlet> to render nested profile routes.
 * - Responsive flex layout for sidebar and content area.
 *
 * Usage:
 * - Used as a parent layout for all profile-related routes.
 *
 * @component
 */

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
