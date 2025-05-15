
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Plus, User, List, LogOut, Menu, Building, LayoutDashboard } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import '@/styles/portal-theme.css';

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
    <div className="flex flex-col h-full portal-sidebar">
      <div className="p-6 border-b border-[var(--portal-border)]">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gold-500 flex items-center justify-center text-black shadow-lg">
            <Building className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-[var(--portal-text)]">Agent Portal</h2>
        </div>
      </div>
      
      <div className="p-4 flex-1">
        <nav className="space-y-1">
          {menuItems.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-gold-500/20 text-gold-500 font-medium' 
                    : 'text-[var(--portal-text-secondary)] hover:bg-[var(--portal-bg-hover)]'
                }`}
                onClick={item.action}
              >
                <div className={`p-1.5 rounded-md ${activeTab === item.id ? 'bg-gold-500 text-black' : 'bg-[var(--portal-card-bg)]'}`}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </div>
            </motion.div>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-5 border-t border-[var(--portal-border)]">
        <div className="p-4 mb-4 rounded-xl bg-[var(--portal-card-bg)] border border-[var(--portal-border)]">
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-gold-500/20 text-gold-500 flex items-center justify-center font-semibold">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium truncate text-[var(--portal-text)]">{user?.email}</p>
              <p className="text-sm text-gold-500">Agent</p>
            </div>
          </div>
        </div>
        
        <Button
          variant="outline"
          className="w-full justify-start text-left border-[var(--portal-border)] text-red-500 hover:bg-red-500/10 hover:text-red-400"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  // Mobile bottom navigation - improved for better usability
  const MobileNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-[var(--portal-sidebar-bg)] border-t border-[var(--portal-border)] py-2 px-4 md:hidden z-10">
      <div className="flex justify-around items-center">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
              activeTab === item.id ? 'text-gold-500' : 'text-[var(--portal-text-secondary)]'
            }`}
            onClick={item.action}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === item.id ? 'bg-gold-500/20' : ''}`}>
              {item.icon}
            </div>
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </button>
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
      <div className="w-72 h-full shadow-lg border-r border-[var(--portal-border)] flex-shrink-0 hidden md:block overflow-hidden">
        <SidebarContent />
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[var(--portal-sidebar-bg)] border-b border-[var(--portal-border)] p-4 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gold-500 flex items-center justify-center text-black shadow-md">
              <Building className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-[var(--portal-text)]">Agent Portal</h2>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[var(--portal-text-secondary)]">
                <Menu className="h-5 w-5" />
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

export default AgentSidebar;
