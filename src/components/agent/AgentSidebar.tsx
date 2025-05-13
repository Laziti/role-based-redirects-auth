
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Plus, User, List, LogOut, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type AgentSidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const AgentSidebar = ({ activeTab, setActiveTab }: AgentSidebarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const menuItems = [
    { 
      id: 'listings', 
      label: 'My Listings', 
      icon: <List className="mr-2 h-4 w-4" />,
      action: () => setActiveTab('listings') 
    },
    { 
      id: 'create', 
      label: 'Create New', 
      icon: <Plus className="mr-2 h-4 w-4" />,
      action: () => setActiveTab('create') 
    },
    { 
      id: 'account', 
      label: 'Account Info', 
      icon: <User className="mr-2 h-4 w-4" />,
      action: () => setActiveTab('account') 
    }
  ];

  const SidebarContent = () => (
    <div className="p-6">
      <div className="flex items-center mb-8">
        <Home className="h-5 w-5 mr-2 text-primary" />
        <h2 className="text-xl font-semibold">Agent Portal</h2>
      </div>
      
      <nav className="space-y-1">
        {menuItems.map(item => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "default" : "ghost"}
            className="w-full justify-start text-left"
            onClick={item.action}
          >
            {item.icon}
            {item.label}
          </Button>
        ))}
        
        <Button
          variant="ghost"
          className="w-full justify-start text-left text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="w-64 bg-white h-full flex-shrink-0 border-r hidden md:block">
        <SidebarContent />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="ml-2 mt-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default AgentSidebar;
