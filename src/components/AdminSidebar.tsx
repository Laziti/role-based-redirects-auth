
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
import { LayoutDashboard, Users, FileCheck, List, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AdminSidebar = () => {
  const { signOut, user } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center p-2">
          <div className="font-bold text-xl text-blue-600">Admin Portal</div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dashboard">
              <NavLink 
                to="/admin" 
                end
                className={({ isActive }) => 
                  isActive ? "data-[active=true]" : ""
                }
              >
                <LayoutDashboard />
                <span>Dashboard</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Users">
              <NavLink 
                to="/admin/users" 
                className={({ isActive }) => 
                  isActive ? "data-[active=true]" : ""
                }
              >
                <Users />
                <span>Users</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Pending Signups">
              <NavLink 
                to="/admin/pending-signups" 
                className={({ isActive }) => 
                  isActive ? "data-[active=true]" : ""
                }
              >
                <FileCheck />
                <span>Pending Signups</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Listings">
              <NavLink 
                to="/admin/listings" 
                className={({ isActive }) => 
                  isActive ? "data-[active=true]" : ""
                }
              >
                <List />
                <span>Listings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-2">
          <div className="text-sm text-gray-500 mb-2">
            {user?.email}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={signOut}
          >
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
