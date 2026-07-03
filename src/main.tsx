import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { SankhyaProvider } from "@/contexts/sankhya-context.tsx";
import { ToastProvider } from "@/components/ui/toast";
import App from "@/app/app.tsx";

import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SankhyaProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </SankhyaProvider>
  </StrictMode>
);
