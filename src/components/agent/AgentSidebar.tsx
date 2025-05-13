
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Home, PlusCircle, User, List, LogOut } from 'lucide-react';

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
      icon: <PlusCircle className="mr-2 h-4 w-4" />,
      action: () => setActiveTab('create') 
    },
    { 
      id: 'account', 
      label: 'Account Info', 
      icon: <User className="mr-2 h-4 w-4" />,
      action: () => setActiveTab('account') 
    }
  ];

  return (
    <div className="w-64 bg-white h-full flex-shrink-0 border-r hidden md:block">
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
    </div>
  );
};

export default AgentSidebar;
