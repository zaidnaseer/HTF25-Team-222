import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DefaultLayout from "./components/layout/DefaultLayout";
import Home from "./pages/Home";
import LearnerHub from "./pages/LearnerHub";

function App() {
  return (
    <Router>
      <DefaultLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learner-hub" element={<LearnerHub />} />
        </Routes>
      </DefaultLayout>
    </Router>
  );
}

export default App;
