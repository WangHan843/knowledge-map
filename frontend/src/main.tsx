import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Learn } from "./pages/Learn";
import { Practice } from "./pages/Practice";
import { Test } from "./pages/Test";
import { NotFound, Reserved } from "./pages/Reserved";
import {Mistakes} from './pages/Mistakes';
import {isStatic} from './lib/runtime';
import "./styles.css";

const Router=isStatic?HashRouter:BrowserRouter;
createRoot(document.getElementById("root")!).render(
  <Router>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="learn/:nodeId" element={<Learn />} />
        <Route path="practice" element={<Practice />} />
        <Route path="practice/:nodeId" element={<Practice />} />
        <Route path="test" element={<Test />} />
        <Route path="mistakes" element={isStatic?<Mistakes/>:<Reserved kind="mistakes" />} />
        <Route path="teacher" element={<Reserved kind="teacher" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </Router>,
);
