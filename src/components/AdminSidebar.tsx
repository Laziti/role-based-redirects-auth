
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Users, FileCheck, List, LogOut, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import '@/styles/portal-theme.css';

export const AdminSidebar = () => {
  const { signOut, user } = useAuth();

  const menuItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", path: "/admin" },
    { icon: <Users className="h-5 w-5" />, label: "Users", path: "/admin/users" },
    { icon: <FileCheck className="h-5 w-5" />, label: "Pending Signups", path: "/admin/pending-signups" },
    { icon: <List className="h-5 w-5" />, label: "Listings", path: "/admin/listings" }
    // Settings removed as requested
  ];

  return (
    <div className="w-72 h-screen flex-shrink-0 overflow-auto portal-sidebar">
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
                <div className={({ isActive }) => 
                  `p-1.5 rounded-md ${
                    isActive ? 'bg-gold-500 text-black' : 'bg-[var(--portal-card-bg)]'
                  }`
                }>
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
};

export default AdminSidebar;
