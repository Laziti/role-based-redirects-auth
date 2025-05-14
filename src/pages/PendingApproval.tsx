
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PendingApproval = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        className="bg-white shadow-xl rounded-2xl max-w-md w-full p-8 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <motion.div 
          className="mb-6 text-yellow-500 mx-auto"
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -5, 0, 5, 0] }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <AlertTriangle className="h-16 w-16 mx-auto" strokeWidth={1.5} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Account Pending Approval</h1>
          <p className="text-gray-600 mb-8">
            Your account is awaiting approval from our administrators. 
            You'll be notified once your account has been approved and you can start using the platform.
          </p>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
            <ul className="space-y-2 text-blue-700 text-sm">
              <li className="flex items-start">
                <span className="inline-block h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center mr-2 mt-0.5">1</span>
                Our admin team will review your application
              </li>
              <li className="flex items-start">
                <span className="inline-block h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center mr-2 mt-0.5">2</span>
                We'll verify your payment receipt
              </li>
              <li className="flex items-start">
                <span className="inline-block h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center mr-2 mt-0.5">3</span>
                Once approved, you'll get full access to your agent dashboard
              </li>
            </ul>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={signOut}
              className="w-full py-2 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow transition-all duration-300 flex items-center justify-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
      
      <motion.div
        className="mt-6 text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Have questions? Contact support at support@realestate.com
      </motion.div>
    </div>
  );
};

export default PendingApproval;
