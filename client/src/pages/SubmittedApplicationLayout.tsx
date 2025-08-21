/**
 * SubmittedApplicationLayout Component
 *
 * This layout component provides a sidebar and content area for all submitted application pages.
 * It displays the SubmittedApplicationSidebar on the left and renders the current route's content on the right.
 *
 * Features:
 * - Displays the SubmittedApplicationSidebar for navigation.
 * - Uses React Router's <Outlet> to render nested submitted application routes.
 * - Responsive flex layout for sidebar and content area.
 *
 * Usage:
 * - Used as a parent layout for all submitted application-related routes.
 *
 * @component
 */

import { Outlet } from "react-router-dom";
import Sidebar from "../components/SubmittedApplicationSidebar/SubmittedApplicationSidebar";

const SubmittedApplicationLayout = () => (
  <div style={{ display: "flex", flexDirection: "row", height: "91vh", overflowY: "hidden" }}>
  <Sidebar />
    <div style={{ flex: 1, padding: "0px", overflowY: "auto" }}>
      <Outlet />
    </div>
  </div>
);

export default SubmittedApplicationLayout;
