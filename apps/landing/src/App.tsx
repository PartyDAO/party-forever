import { Route, Routes } from "react-router";

import { Footer } from "@party-forever/ui";

import { Terms } from "./Terms.tsx";
import { Home } from "./Home.tsx";

const App = () => (
  <div className="min-h-screen w-full max-w-7xl mx-auto flex flex-col">
    <main className="flex-1">
      <Routes>
        <Route index element={<Home />} />
        <Route path="terms" element={<Terms />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

export default App;
