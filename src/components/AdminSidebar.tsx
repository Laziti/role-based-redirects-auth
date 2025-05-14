
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
import { LayoutDashboard, Users, FileCheck, List, LogOut, Settings } from 'lucide-react';
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
        <div className="flex items-center p-4">
          <div className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Admin Portal</div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item, index) => (
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
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4 p-2 bg-sidebar-accent rounded-lg">
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-sidebar-foreground/70">Super Admin</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center border-sidebar-border hover:bg-sidebar-accent"
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
