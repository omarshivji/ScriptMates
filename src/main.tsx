import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App";
import nav from "./nav";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
      <nav>
        <ul className="flex gap-4">
          <li>
            <a href="/" className="text-blue-500 hover:underline">
              Home
            </a>
          </li>
          <li>
            <a href="/about" className="text-blue-500 hover:underline">
              About
            </a>
          </li>
          <li>
            <a href="/contact" className="text-blue-500 hover:underline">
              Contact
            </a>
          </li>
        </ul>
      </nav>
      
    </ConvexAuthProvider>
  </StrictMode>,
);
