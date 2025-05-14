
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarFooter
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Users, FileCheck, List, LogOut, Settings, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export const AdminSidebar = () => {
  const { signOut, user } = useAuth();

  const menuItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", path: "/admin" },
    { icon: <Users className="h-5 w-5" />, label: "Users", path: "/admin/users" },
    { icon: <FileCheck className="h-5 w-5" />, label: "Pending Signups", path: "/admin/pending-signups" },
    { icon: <List className="h-5 w-5" />, label: "Listings", path: "/admin/listings" },
    { icon: <Settings className="h-5 w-5" />, label: "Settings", path: "/admin/settings" }
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center p-4 space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Building className="h-6 w-6" />
          </div>
          <div className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Admin Portal</div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarMenu>
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <SidebarMenuItem key={index}>
                <SidebarMenuButton asChild tooltip={item.label}>
                  <NavLink 
                    to={item.path} 
                    end={item.path === "/admin"}
                    className={({ isActive }) => 
                      isActive ? "data-[active=true]" : ""
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </motion.div>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-medium shadow-md shadow-purple-500/20">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">Super Admin</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center border-gray-300 dark:border-gray-700 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
