import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, userRole, userStatus } = useAuth();
  const navigate = useNavigate();

  // Redirect based on role
  useEffect(() => {
    if (user && userRole) {
      if (userRole === 'super_admin') {
        navigate('/admin');
      } else if (userRole === 'agent' && userStatus === 'approved') {
        navigate('/agent');
      } else if (userRole === 'agent' && userStatus === 'pending_approval') {
        navigate('/pending');
      }
    }
  }, [user, userRole, userStatus, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--portal-bg)] to-[var(--portal-card-bg)] text-[var(--portal-text)] overflow-hidden">
      {/* Hero Section */}
      <section className="min-h-screen relative flex items-center justify-center">
        {/* Enhanced Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Main gradient circles */}
          <motion.div 
            className="absolute w-[800px] h-[800px] rounded-full bg-gold-500/5 -top-[400px] left-1/2 transform -translate-x-1/2"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute w-[600px] h-[600px] rounded-full bg-gold-500/5 -bottom-[300px] left-1/2 transform -translate-x-1/2"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          
          {/* Floating elements */}
          {/* Left side floating elements */}
          <motion.div
            className="absolute w-16 h-16 rounded-full bg-gold-500/10 top-20 left-[15%]"
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              rotate: [0, 45, 0]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute w-24 h-24 rounded-lg bg-gold-500/8 top-1/3 left-[10%] rotate-12"
            animate={{
              y: [0, 50, 0],
              rotate: [12, -12, 12]
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3
            }}
          />
          <motion.div
            className="absolute w-14 h-14 rounded-xl bg-gold-500/10 bottom-1/4 left-[20%]"
            animate={{
              scale: [1, 1.3, 1],
              y: [0, -40, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          <motion.div
            className="absolute w-10 h-10 rounded-full bg-gold-500/15 bottom-[15%] left-[30%]"
            animate={{
              x: [0, 30, 0],
              y: [0, 20, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5
            }}
          />
          
          {/* Right side floating elements */}
          <motion.div
            className="absolute w-20 h-20 rounded-lg bg-gold-500/10 bottom-32 right-[20%]"
            animate={{
              y: [0, 40, 0],
              x: [0, -30, 0],
              rotate: [0, -45, 0]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          <motion.div
            className="absolute w-12 h-12 rounded-xl bg-gold-500/10 top-1/2 right-[15%]"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="inline-block mb-4 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-500 font-medium text-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                The Ultimate Real Estate Platform
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-500 to-gold-300">Real Estate</span> Business
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl text-[var(--portal-text-secondary)] mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Create beautiful property listings and share them through your personalized profile. Connect directly with clients and grow your business with our professional tools.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                {!user ? (
                  <>
                    <Link to="/auth">
                      <Button 
                        size="lg" 
                        className="bg-gold-500 hover:bg-gold-600 text-black px-8 rounded-lg shadow-lg hover:shadow-gold-500/20 transition-all duration-300 w-full sm:w-auto"
                        onClick={() => {
                          localStorage.setItem('authMode', 'signup');
                        }}
                      >
                        Get Started Now
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="border-gold-500 text-gold-500 hover:bg-gold-500/10 px-8 rounded-lg transition-all duration-300 w-full sm:w-auto"
                        onClick={() => {
                          localStorage.setItem('authMode', 'signin');
                        }}
                      >
                        Sign In
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Button 
                    onClick={() => userRole === 'super_admin' ? navigate('/admin') : navigate('/agent')}
                    className="bg-gold-500 hover:bg-gold-600 text-black px-8 rounded-lg shadow-lg hover:shadow-gold-500/20 transition-all duration-300"
                  >
                    Go to Dashboard
                  </Button>
                )}
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-center gap-8 text-[var(--portal-text-secondary)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
              >
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-gold-500 mr-2" />
                  <span>5000 birr/month</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-gold-500 mr-2" />
                  <span>100 listings/month</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
