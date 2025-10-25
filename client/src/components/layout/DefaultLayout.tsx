import { FC, ReactNode } from "react";
import Navbar from "./Navbar";

interface DefaultLayoutProps {
  children: ReactNode;
}

const DefaultLayout: FC<DefaultLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Navbar />
      <main className="flex justify-center flex-1 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl">{children}</div>
      </main>
      <footer className="bg-gray-800 text-gray-300 text-center py-4 mt-auto">
        © 2025 P-LEX. All rights reserved.
      </footer>
    </div>
  );
};

export default DefaultLayout;
