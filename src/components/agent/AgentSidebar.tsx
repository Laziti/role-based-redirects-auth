import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Plus, User, List, LogOut, Menu, Building } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { motion } from 'framer-motion';

type AgentSidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const AgentSidebar = ({ activeTab, setActiveTab }: AgentSidebarProps) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const menuItems = [
    { 
      id: 'listings', 
      label: 'My Listings', 
      icon: <List className="h-5 w-5" />,
      action: () => setActiveTab('listings') 
    },
    { 
      id: 'create', 
      label: 'Create New', 
      icon: <Plus className="h-5 w-5" />,
      action: () => setActiveTab('create') 
    },
    { 
      id: 'account', 
      label: 'Account Info', 
      icon: <User className="h-5 w-5" />,
      action: () => setActiveTab('account') 
    }
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <Building className="h-7 w-7 text-indigo-600" />
          <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Agent Portal</h2>
        </div>
      </div>
      
      <div className="p-6 flex-1">
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Button
                variant={activeTab === item.id ? "default" : "ghost"}
                className={`w-full justify-start text-left ${
                  activeTab === item.id ? 
                  "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" : 
                  "hover:bg-slate-100"
                }`}
                onClick={item.action}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Button>
            </motion.div>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-slate-200">
        <div className="flex items-center space-x-3 mb-4 p-2 bg-slate-50 rounded-lg">
          <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium">
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-slate-500">Agent</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          className="w-full justify-start text-left text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  // Mobile bottom navigation
  const MobileNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 md:hidden">
      <div className="flex justify-around items-center">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`flex flex-col items-center p-2 ${
              activeTab === item.id ? 'text-indigo-600' : 'text-gray-500'
            }`}
            onClick={item.action}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
        <button 
          className="flex flex-col items-center p-2 text-red-500"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          <span className="text-xs mt-1">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="w-64 bg-white h-full shadow-sm border-r border-slate-200 flex-shrink-0 hidden md:block">
        <SidebarContent />
      </div>
      
      {/* Mobile Hamburger Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Building className="h-6 w-6 text-indigo-600" />
            <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Agent Portal</h2>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
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

export default AgentSidebar;
