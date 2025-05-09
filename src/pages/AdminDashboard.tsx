
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const AdminDashboard = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">Super Admin Dashboard</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-sm text-gray-500">
                {user?.email}
              </span>
              <button
                onClick={signOut}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Welcome to the Admin Dashboard</h2>
          <p className="text-gray-500">As a Super Admin, you have access to all features and functionality of the system.</p>
          
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">User Management</h3>
              <p className="text-sm text-gray-500">Manage users and their permissions</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">System Settings</h3>
              <p className="text-sm text-gray-500">Configure system-wide settings</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Reports</h3>
              <p className="text-sm text-gray-500">View system reports and analytics</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Audit Logs</h3>
              <p className="text-sm text-gray-500">Review system activity and changes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
