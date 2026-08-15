import { HashRouter, Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import TopicReference from "./pages/TopicReference";
import Quiz from "./pages/Quiz";
import "./App.css";

export default function App() {
  return (
    <HashRouter>
      <header className="app-header">
        <Link to="/" className="app-title">
          ⛵ Basic Keelboat Study
        </Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reference/:topicId" element={<TopicReference />} />
          <Route path="/quiz" element={<Quiz />} />
        </Routes>
      </main>
    </HashRouter>
  );
}
