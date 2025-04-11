import React from 'react';
import Navbar from './components/layout/NavBar';
import Footer from './components/layout/Footer';
import { Outlet } from 'react-router-dom';


const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-2 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
