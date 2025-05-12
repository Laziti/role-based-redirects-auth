
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  UserCircle, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AgentSidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const AgentSidebar = ({ activeTab, setActiveTab }: AgentSidebarProps) => {
  const { signOut, user } = useAuth();

  const navItems = [
    { id: 'listings', label: 'My Listings', icon: LayoutDashboard },
    { id: 'create', label: 'Create New Listing', icon: PlusCircle },
    { id: 'account', label: 'Account Info', icon: UserCircle },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 hidden md:block">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Agent Portal</h2>
          <p className="text-sm text-gray-500 mt-1 truncate">
            {user?.email}
          </p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === item.id
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5 mr-2" />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={signOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AgentSidebar;
