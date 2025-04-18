import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="w-full border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <img src="/logo.jpg" alt="InterviewShare Logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold">InterviewShare</h1>

          <div className="hidden md:flex gap-4">
            <Button variant="ghost" asChild>
              <Link to="/posts">Browse Interviews</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/mock-interviews">Mock Lab</Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Button variant="secondary" size="sm" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>

              <Button asChild>
                <Link to="/create-post" className="gap-1">
                  <Plus className="h-4 w-4" /> New Post
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer">
                    <AvatarImage src={user?.avatar || "/default-avatar.png"} alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user?.username || "User"}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background px-4 py-3 space-y-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/posts">Browse Interviews</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/mock-interviews">Mock Lab</Link>
          </Button>

          {isAuthenticated ? (
            <>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
