
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const AgentDashboard = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-green-600">Agent Dashboard</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-sm text-gray-500">
                {user?.email}
              </span>
              <button
                onClick={signOut}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Welcome to the Agent Dashboard</h2>
          <p className="text-gray-500">As an Agent, you have access to client management and support features.</p>
          
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Client Management</h3>
              <p className="text-sm text-gray-500">Manage your client accounts</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Support Tickets</h3>
              <p className="text-sm text-gray-500">View and respond to support tickets</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Knowledge Base</h3>
              <p className="text-sm text-gray-500">Access support documentation</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Your Performance</h3>
              <p className="text-sm text-gray-500">Track your performance metrics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
