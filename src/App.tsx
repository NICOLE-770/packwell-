import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Share from "./pages/Share";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/share" element={<Share />} />
      </Routes>
    </Router>
  );
}
