
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Building, CheckCircle, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, userRole, userStatus, signOut } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 overflow-hidden">
      {/* Hero Section */}
      <section className="min-h-screen relative flex items-center">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-[800px] h-[800px] rounded-full bg-blue-100/50 -top-[400px] -right-[200px]" />
          <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-100/50 -bottom-[300px] -left-[200px]" />
          <motion.div 
            className="absolute w-12 h-12 rounded-xl bg-blue-200/30 backdrop-blur-sm top-20 right-[20%]"
            animate={{ 
              y: [0, 20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute w-20 h-20 rounded-full bg-indigo-200/30 backdrop-blur-sm bottom-40 left-[15%]"
            animate={{ 
              y: [0, -30, 0],
              x: [0, 15, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <motion.div 
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-medium text-sm"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                The Ultimate Real Estate Platform
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">Real Estate</span> Business
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Create beautiful property listings and share them through your personalized profile. Connect directly with clients and grow your business with our professional tools.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                {!user ? (
                  <Link to="/auth">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                    >
                      Get Started Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    onClick={() => userRole === 'super_admin' ? navigate('/admin') : navigate('/agent')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                  >
                    Go to Dashboard
                  </Button>
                )}
              </motion.div>
              
              <motion.div 
                className="flex items-center justify-center lg:justify-start gap-8 text-slate-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
              >
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <span>5000 birr/month</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <span>100 listings/month</span>
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="lg:flex-1 w-full max-w-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 blur-xl opacity-20 rounded-2xl transform rotate-3"></div>
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                  <div className="aspect-[4/3]">
                    <img 
                      src="/hero-property.jpg" 
                      alt="Luxury property listing" 
                      className="object-cover h-full w-full"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-slate-900">Luxury Villa</h3>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    </div>
                    <p className="text-slate-500 mb-4">Elegant 5 bedroom villa with swimming pool and garden</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-blue-600">$450,000</p>
                      <div className="flex gap-2">
                        <motion.button 
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Users className="h-5 w-5" />
                        </motion.button>
                        <motion.button 
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Building className="h-5 w-5" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <motion.div 
                  className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg border border-slate-100 flex items-center gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    JD
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">John Doe</p>
                    <p className="text-sm text-slate-500">Real Estate Agent</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
