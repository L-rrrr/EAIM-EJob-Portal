import {
  BrowserRouter as Router,
} from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { ThemeProvider } from "./hooks/useTheme";

// ------------------------ App Component ------------------------

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <div style={{ width: "100vw", minHeight: "100vh" }}>
          <AppRoutes />
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;