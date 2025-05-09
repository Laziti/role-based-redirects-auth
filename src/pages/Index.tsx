
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, userRole, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Welcome to Role-Based Auth Demo</h1>
        
        {user ? (
          <div className="space-y-6">
            <p className="text-lg text-gray-600">
              You are logged in as: <span className="font-medium">{user.email}</span>
            </p>
            <p className="text-md text-gray-600">
              Your role: <span className="font-medium capitalize">{userRole || 'Loading...'}</span>
            </p>
            
            <div className="flex flex-col gap-4">
              {userRole === 'super_admin' && (
                <Link 
                  to="/admin" 
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go to Admin Dashboard
                </Link>
              )}
              
              {userRole === 'agent' && (
                <Link 
                  to="/agent" 
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Go to Agent Dashboard
                </Link>
              )}
              
              <button
                onClick={signOut}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-lg text-gray-600">
              Please sign in or create an account to get started
            </p>
            
            <div className="flex flex-col gap-4">
              <Link 
                to="/auth" 
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign In / Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
