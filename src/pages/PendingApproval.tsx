import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle, ClipboardCheck, LogOut, ArrowLeft, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PendingApproval = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    // Add page title
    document.title = "Account Pending Approval | Estate Portal";
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--portal-bg)]">
      {/* Header bar with logo */}
      <header className="border-b border-[var(--portal-border)] py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gold-500 rounded-lg flex items-center justify-center shadow-lg shadow-gold-500/20">
              <Building className="h-6 w-6 text-black" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[var(--portal-text)] to-gold-500 bg-clip-text text-transparent">Estate Portal</span>
          </div>
        </div>
      </header>

      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full bg-gold-500/5 -top-[300px] right-[10%]"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute w-[500px] h-[500px] rounded-full bg-gold-500/5 -bottom-[250px] left-[5%]"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl bg-[var(--portal-card-bg)] rounded-2xl shadow-xl border border-[var(--portal-border)] overflow-hidden"
        >
          {/* Top gold bar */}
          <div className="h-2 bg-gradient-to-r from-gold-600 to-gold-400"></div>
          
          <div className="p-8">
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-2xl font-bold text-center text-[var(--portal-text)] mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Account Pending Approval
            </motion.h1>
            
            <motion.p 
              className="text-center text-[var(--portal-text-secondary)] mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Your account is awaiting approval from our administrators. You'll be notified once your account has been approved and you can start using the platform.
            </motion.p>
            
            <motion.div 
              className="bg-[var(--portal-bg-hover)]/30 rounded-xl border border-[var(--portal-border)]/60 p-5 mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h2 className="text-lg font-medium text-[var(--portal-text)] mb-4 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold-500 text-black mr-2 text-xs font-bold">?</span>
                What happens next?
              </h2>
              
              <div className="space-y-4">
                <motion.div 
                  className="flex gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    1
                  </div>
                  <div className="flex items-start gap-2">
                    <ClipboardCheck className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[var(--portal-text)]">Our admin team will review your application</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium">
                    2
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[var(--portal-text)]">We'll verify your payment receipt</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">
                    3
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[var(--portal-text)]">
                Once approved, you'll get full access to your agent dashboard
                    </p>
                  </div>
                </motion.div>
          </div>
            </motion.div>
          
          <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <Link to="/">
                <Button variant="outline" className="w-full sm:w-auto border-[var(--portal-border)] text-[var(--portal-text-secondary)] hover:bg-[var(--portal-bg-hover)] flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              
              <Button 
                onClick={handleSignOut}
                className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </motion.div>
          </div>
        </motion.div>
      </div>
      
      <footer className="p-4 border-t border-[var(--portal-border)] text-center">
        <p className="text-sm text-[var(--portal-text-secondary)]">
          Have questions? Contact support at{' '}
          <a 
            href="mailto:support@realestate.com" 
            className="text-gold-500 hover:text-gold-600 transition-colors"
          >
            support@realestate.com
          </a>
        </p>
      </footer>
    </div>
  );
};

export default PendingApproval;
