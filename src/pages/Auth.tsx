import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check as CheckIcon, Building as BuildingIcon, ArrowLeft, Mail, Lock, User, Phone, Briefcase, FileText } from 'lucide-react';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const signUpSchema = signInSchema.extend({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  phoneNumber: z.string().min(10, { message: 'Valid phone number is required' }),
  career: z.string().min(1, { message: 'Career is required' }),
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;
type FormValues = SignUpFormValues;

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const { signIn, signUp, user, userRole } = useAuth();
  const navigate = useNavigate();

  // Check localStorage for authMode on component mount
  useEffect(() => {
    const authMode = localStorage.getItem('authMode');
    if (authMode === 'signup') {
      setIsSignUp(true);
    } else if (authMode === 'signin') {
      setIsSignUp(false);
    }
    // Clear localStorage after using it
    localStorage.removeItem('authMode');
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      career: '',
    },
  });

  useEffect(() => {
    // Reset form when switching between sign-in and sign-up
    reset();
    setReceiptFile(null);
  }, [isSignUp, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        // Validate receipt file
        if (!receiptFile) {
          toast.error({
            title: 'Missing receipt',
            description: 'Please upload a payment receipt to continue.'
          });
          setIsLoading(false);
          return;
        }

        // First, upload the receipt file
          const fileExt = receiptFile.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `payment_receipts/${fileName}`;
          
          // Upload receipt file to storage
          const { error: uploadError } = await supabase.storage
            .from('files')
            .upload(filePath, receiptFile);
            
          if (uploadError) throw uploadError;
          
        // Get public URL for the receipt
          const { data: { publicUrl } } = supabase.storage
            .from('files')
            .getPublicUrl(filePath);
            
        // Sign up user with metadata
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
              phone_number: data.phoneNumber,
              career: data.career,
              payment_receipt_url: publicUrl
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        if (!signUpData.user) {
          throw new Error('Failed to create user account');
        }
            
          // Update profile with additional information
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              first_name: data.firstName,
              last_name: data.lastName,
              phone_number: data.phoneNumber,
              career: data.career,
            payment_receipt_url: publicUrl,
            status: 'pending_approval'
            })
          .eq('id', signUpData.user.id);
            
          if (profileError) throw profileError;
        
        toast.success({
          title: 'Account created',
          description: 'Your account is pending approval.'
        });
        reset();
        navigate('/pending');
      } else {
        // Sign in
        const { error } = await signIn(data.email, data.password);
        
        if (error) throw error;
        
        // Navigate based on user role
        if (userRole === 'super_admin') {
          navigate('/admin');
        } else if (userRole === 'agent') {
          navigate('/agent');
        } else {
          navigate('/');
        }
        
        toast.success({
          title: 'Welcome back!',
          description: 'You have successfully signed in.'
        });
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error({
        title: 'Authentication failed',
        description: error.message || 'Please check your credentials and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error({
          title: 'File too large',
          description: 'The receipt file must be less than 5MB.'
        });
        return;
      }
      
      // Check file type (image or PDF)
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error({
          title: 'Invalid file type',
          description: 'Please upload a JPG, PNG, or PDF file.'
        });
        return;
      }
      
      setReceiptFile(file);
      toast.success({
        title: 'File uploaded',
        description: 'Receipt file has been uploaded successfully.'
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--portal-bg)]">
      {/* Full-width form section with enhanced design */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-gold-500/5 pointer-events-none"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(var(--portal-border) 1px, transparent 1px), linear-gradient(90deg, var(--portal-border) 1px, transparent 1px)', 
          backgroundSize: '40px 40px',
          opacity: 0.05
        }}></div>
        
        {/* Animated background elements - fewer and more spread out */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Main gradient circles */}
          <motion.div 
            className="absolute w-[1000px] h-[1000px] rounded-full bg-gradient-to-br from-gold-500/10 to-transparent -top-[400px] left-[20%] blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.2, 0.3],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div 
            className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-gold-500/8 to-transparent -bottom-[300px] right-[20%] blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />

          {/* Just 3 floating elements spread across the whole width */}
          <motion.div
            className="absolute w-32 h-32 rounded-2xl bg-gradient-to-br from-gold-500/15 to-gold-500/5 top-[20%] left-[15%] backdrop-blur-sm border border-gold-500/10"
            style={{ transform: 'perspective(1000px) rotateX(10deg) rotateY(-10deg)' }}
            animate={{ 
              y: [0, -30, 0],
              rotateZ: [0, 5, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div
            className="absolute w-20 h-20 rounded-xl bg-gradient-to-tr from-gold-500/10 to-transparent bottom-[30%] right-[15%] backdrop-blur-sm border border-gold-500/10"
            style={{ transform: 'perspective(1000px) rotateX(-5deg) rotateY(10deg)' }}
            animate={{
              y: [0, 40, 0],
              rotateZ: [0, -3, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
            </div>

        <motion.div 
          className="mx-auto w-full max-w-md relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center mb-8">
            <motion.div 
              className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-400 flex items-center justify-center text-black shadow-lg mb-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BuildingIcon className="h-10 w-10" />
            </motion.div>
            <Link 
              to="/" 
              className="text-sm text-gold-400 hover:text-gold-500 flex items-center gap-1 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </div>

          <motion.h2 
            className="text-4xl font-extrabold text-center mb-2 bg-gradient-to-r from-gold-500 to-gold-300 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </motion.h2>
          
          <motion.p 
            className="text-center text-[var(--portal-text-secondary)] mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {isSignUp ? 'Join our real estate platform today' : 'Sign in to access your dashboard'}
          </motion.p>

          <motion.form 
            className="space-y-6" 
            onSubmit={handleSubmit(onSubmit)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="space-y-4">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                Email
              </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gold-500/50" />
                  </div>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                    className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                  placeholder="your@email.com"
                />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                Password
              </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gold-500/50" />
                  </div>
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                    className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                  placeholder="••••••••"
                />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
            </div>

            {isSignUp && (
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                      First Name
                    </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gold-500/50" />
                        </div>
                      <input
                        id="firstName"
                        type="text"
                        {...register('firstName')}
                          className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                        placeholder="John"
                      />
                      </div>
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
                      )}
                  </div>

                  <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                      Last Name
                    </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gold-500/50" />
                        </div>
                      <input
                        id="lastName"
                        type="text"
                        {...register('lastName')}
                          className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                        placeholder="Doe"
                      />
                      </div>
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
                      )}
                  </div>
                </div>

                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                    Phone Number
                  </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gold-500/50" />
                      </div>
                    <input
                      id="phoneNumber"
                      type="tel"
                      {...register('phoneNumber')}
                        className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                      placeholder="+1234567890"
                    />
                    </div>
                    {errors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-500">{errors.phoneNumber.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="career" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                    Career
                  </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-gold-500/50" />
                      </div>
                    <input
                      id="career"
                      type="text"
                      {...register('career')}
                        className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                      placeholder="Real Estate Agent"
                    />
                    </div>
                    {errors.career && (
                      <p className="mt-1 text-sm text-red-500">{errors.career.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="receipt" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                      Upload Payment Receipt
                  </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-5 w-5 text-gold-500/50" />
                      </div>
                    <input
                      id="receipt"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      onChange={handleFileChange}
                        className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gold-500/10 file:text-gold-500 hover:file:bg-gold-500/20"
                    />
                    </div>
                    {receiptFile && (
                      <p className="mt-2 text-sm text-green-500 flex items-center gap-1">
                        <CheckIcon className="h-4 w-4" />
                        File selected: {receiptFile.name}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-gold-400">
                      Upload proof of payment to proceed with registration.
                    </p>
                  </div>
                </motion.div>
              )}
                </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                className="w-full gradient-btn py-3 rounded-xl text-base font-medium shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>{isSignUp ? 'Create Account' : 'Sign In'}</>
                )}
              </Button>
            </motion.div>
          </motion.form>

          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                reset();
                setReceiptFile(null);
              }}
              className="text-sm text-gold-400 hover:text-gold-500 transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
