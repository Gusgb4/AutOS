import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <Sidebar />

      <main className="min-h-screen pl-24">
        <Outlet />
      </main>
    </div>
  );
}