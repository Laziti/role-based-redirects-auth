
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
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-blue-50">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white">
            <Building className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Agent Portal</h2>
        </div>
      </div>
      
      <div className="p-4 flex-1">
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Button
                variant={activeTab === item.id ? "default" : "ghost"}
                className={`w-full justify-start text-left ${
                  activeTab === item.id ? 
                  "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800" : 
                  "hover:bg-blue-50 text-slate-700"
                }`}
                onClick={item.action}
              >
                <div className="mr-3">
                  {item.icon}
                </div>
                {item.label}
              </Button>
            </motion.div>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-slate-200">
        <div className="p-4 mb-4 rounded-xl bg-blue-50 border border-blue-100">
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium truncate text-slate-900">{user?.email}</p>
              <p className="text-sm text-blue-700">Agent</p>
            </div>
          </div>
        </div>
        
        <Button
          variant="outline"
          className="w-full justify-start text-left border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  // Mobile bottom navigation
  const MobileNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-4 md:hidden">
      <div className="flex justify-around items-center">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`flex flex-col items-center p-2 ${
              activeTab === item.id ? 'text-blue-600' : 'text-slate-500'
            }`}
            onClick={item.action}
          >
            <div className={`p-1 rounded-lg ${activeTab === item.id ? 'bg-blue-100' : ''}`}>
              {item.icon}
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
        <button 
          className="flex flex-col items-center p-2 text-red-500"
          onClick={signOut}
        >
          <div className="p-1">
            <LogOut className="h-5 w-5" />
          </div>
          <span className="text-xs mt-1">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="w-72 h-full shadow-lg border-r border-slate-200 flex-shrink-0 hidden md:block overflow-hidden">
        <SidebarContent />
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white">
              <Building className="h-5 w-5" />
            </div>
            <h2 className="font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Agent Portal</h2>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-700">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
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
