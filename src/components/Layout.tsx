// src/components/Layout.tsx

import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Navbar />
      <main className="">
        <Outlet />
      </main>
    </div>
  );
}