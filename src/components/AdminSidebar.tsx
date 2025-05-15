
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Users, FileCheck, List, LogOut, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import '@/styles/portal-theme.css';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const AdminSidebar = () => {
  const { signOut, user } = useAuth();

  const menuItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", path: "/admin" },
    { icon: <Users className="h-5 w-5" />, label: "Users", path: "/admin/users" },
    { icon: <FileCheck className="h-5 w-5" />, label: "Pending Signups", path: "/admin/pending-signups" },
    { icon: <List className="h-5 w-5" />, label: "Listings", path: "/admin/listings" }
  ];

  // Desktop sidebar content
  const SidebarContent = () => (
    <div className="w-full h-full flex-shrink-0 overflow-auto portal-sidebar">
      <div className="p-6 border-b border-[var(--portal-border)]">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-gold-500 flex items-center justify-center text-black shadow-lg">
            <Building className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-[var(--portal-text)] to-gold-500 bg-clip-text text-transparent">Admin Portal</h2>
        </div>
      </div>
      
      <div className="p-4">
        <nav className="space-y-1">
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <NavLink 
                to={item.path} 
                end={item.path === "/admin"}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-gold-500/20 text-gold-500 font-medium' 
                      : 'text-[var(--portal-text-secondary)] hover:bg-[var(--portal-bg-hover)]'
                  }`
                }
              >
                {/* Fix: Use a function component for conditional classes instead of a function returning a string */}
                <div className={`p-1.5 rounded-md ${
                  location.pathname === item.path ? 'bg-gold-500 text-black' : 'bg-[var(--portal-card-bg)]'
                }`}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </NavLink>
            </motion.div>
          ))}
        </nav>
      </div>
      
      <div className="p-4 mt-auto border-t border-[var(--portal-border)]">
        <div className="p-4 mb-4 rounded-xl bg-[var(--portal-card-bg)] border border-[var(--portal-border)]">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gold-500/20 text-gold-500 flex items-center justify-center font-semibold">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-[var(--portal-text)]">{user?.email}</p>
              <p className="text-xs text-gold-500">Super Admin</p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center border-[var(--portal-border)] text-red-500 hover:bg-red-500/10 hover:text-red-400"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
  
  // Mobile bottom navigation
  const MobileNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-[var(--portal-sidebar-bg)] border-t border-[var(--portal-border)] py-2 px-4 md:hidden z-10">
      <div className="flex justify-around items-center">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) => 
              `flex flex-col items-center p-2 rounded-lg transition-all ${
                isActive ? 'text-gold-500' : 'text-[var(--portal-text-secondary)]'
              }`
            }
          >
            {/* Fix: Use a static string class instead of a function returning a string */}
            <div className={`p-1.5 rounded-lg ${location.pathname === item.path ? 'bg-gold-500/20' : ''}`}>
              {item.icon}
            </div>
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </NavLink>
        ))}
        <button 
          className="flex flex-col items-center p-2 text-red-500"
          onClick={signOut}
        >
          <div className="p-1.5">
            <LogOut className="h-5 w-5" />
          </div>
          <span className="text-xs mt-1 font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="w-72 h-screen flex-shrink-0 overflow-auto portal-sidebar hidden md:block">
        <SidebarContent />
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[var(--portal-sidebar-bg)] border-b border-[var(--portal-border)] p-4 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gold-500 flex items-center justify-center text-black shadow-md">
              <Building className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-[var(--portal-text)]">Admin Portal</h2>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[var(--portal-text-secondary)]">
                <List className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-[var(--portal-sidebar-bg)] border-r border-[var(--portal-border)]">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </>
  );
};

export default AdminSidebar;
