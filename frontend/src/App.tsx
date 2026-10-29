import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Scanner from "./pages/Scanner";
import Result from "./pages/Result";
import History from "./pages/History";
import Import from "./pages/Import";

export default function App() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scan" element={<Scanner />} />
          <Route path="/result" element={<Result />} />
          <Route path="/history" element={<History />} />
          <Route path="/import" element={<Import />} />
        </Routes>
      </main>
    </div>
  );
}
