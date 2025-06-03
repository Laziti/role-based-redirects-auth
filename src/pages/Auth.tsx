import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check as CheckIcon, Building as BuildingIcon, ArrowLeft, Mail, Lock, User, Phone, Briefcase, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const signUpSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  phoneNumber: z.string().min(10, { message: 'Valid phone number is required' }),
  career: z.string().min(1, { message: 'Career is required' }),
  paymentReceipt: z.any().refine((files) => files?.length === 1, 'Payment receipt is required'),
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, userRole, userStatus, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // Redirect authenticated users
  useEffect(() => {
    console.log('Auth redirect check:', { user: !!user, userRole, userStatus, loading });
    
    if (!loading && user && userRole) {
      console.log('Redirecting user with role:', userRole, 'status:', userStatus);
      
      if (userRole === 'super_admin') {
        console.log('Redirecting super admin to /admin');
        navigate('/admin');
      } else if (userRole === 'agent') {
        if (userStatus === 'approved') {
          console.log('Redirecting approved agent to /dashboard');
          navigate('/dashboard');
        } else if (userStatus === 'pending_approval') {
          console.log('Redirecting pending agent to /pending');
          navigate('/pending');
        }
      }
    }
  }, [user, userRole, userStatus, navigate, loading]);

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      career: '',
    },
  });

  const onSignIn = async (data: SignInFormValues) => {
    setIsLoading(true);
    try {
      console.log('Starting sign in process for:', data.email);
      const { error } = await signIn(data.email, data.password);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Signed in successfully",
      });
      
      // The redirect will be handled by the useEffect above
    } catch (error: any) {
      console.error('Sign-in error:', error);
      toast({
        title: "Error",
        description: error.message || 'An error occurred during sign in',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUp = async (data: SignUpFormValues) => {
    setIsLoading(true);
    try {
      // Upload payment receipt first
      const file = data.paymentReceipt[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone_number: data.phoneNumber,
            career: data.career,
            payment_receipt_url: publicUrl,
          }
        }
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      toast({
        title: "Success",
        description: "Account created successfully! Please wait for admin approval.",
      });
      
      navigate('/pending');
    } catch (error: any) {
      console.error('Sign-up error:', error);
      toast({
        title: "Error",
        description: error.message || 'An error occurred during sign up',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--portal-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div 
          className="bg-[var(--portal-card-bg)] rounded-2xl shadow-xl p-8 border border-[var(--portal-border)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-8">
            <Link 
              to="/"
              className="text-[var(--portal-text-secondary)] hover:text-gold-500 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-12 w-12 rounded-xl bg-gold-500 flex items-center justify-center text-black shadow-lg">
              <BuildingIcon className="h-6 w-6" />
            </div>
            <div className="w-5" />
          </div>

          <motion.h1 
            className="text-2xl font-bold text-center text-[var(--portal-text)] mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </motion.h1>

          <motion.p 
            className="text-center text-[var(--portal-text-secondary)] mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {isSignUp ? 'Join our real estate platform today' : 'Sign in to access your dashboard'}
          </motion.p>

          {!isSignUp ? (
            <motion.form 
              className="space-y-6" 
              onSubmit={signInForm.handleSubmit(onSignIn)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Sign In Form */}
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
                    {...signInForm.register('email')}
                    className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                    placeholder="your@email.com"
                  />
                </div>
                {signInForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-500">{signInForm.formState.errors.email.message}</p>
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
                    {...signInForm.register('password')}
                    className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
                {signInForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-500">{signInForm.formState.errors.password.message}</p>
                )}
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full gradient-btn py-3 rounded-xl text-base font-medium shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </motion.div>
            </motion.form>
          ) : (
            <motion.form 
              className="space-y-6" 
              onSubmit={signUpForm.handleSubmit(onSignUp)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Sign Up Form */}
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
                      {...signUpForm.register('firstName')}
                      className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                      placeholder="John"
                    />
                  </div>
                  {signUpForm.formState.errors.firstName && (
                    <p className="mt-1 text-sm text-red-500">{signUpForm.formState.errors.firstName.message}</p>
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
                      {...signUpForm.register('lastName')}
                      className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                      placeholder="Doe"
                    />
                  </div>
                  {signUpForm.formState.errors.lastName && (
                    <p className="mt-1 text-sm text-red-500">{signUpForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

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
                    {...signUpForm.register('email')}
                    className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                    placeholder="your@email.com"
                  />
                </div>
                {signUpForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-500">{signUpForm.formState.errors.email.message}</p>
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
                    {...signUpForm.register('password')}
                    className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
                {signUpForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-500">{signUpForm.formState.errors.password.message}</p>
                )}
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
                    {...signUpForm.register('phoneNumber')}
                    className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                    placeholder="+251 91 234 5678"
                  />
                </div>
                {signUpForm.formState.errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-500">{signUpForm.formState.errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="career" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                  Career/Job Title
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gold-500/50" />
                  </div>
                  <input
                    id="career"
                    type="text"
                    {...signUpForm.register('career')}
                    className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                    placeholder="Real Estate Agent"
                  />
                </div>
                {signUpForm.formState.errors.career && (
                  <p className="mt-1 text-sm text-red-500">{signUpForm.formState.errors.career.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="paymentReceipt" className="block text-sm font-medium text-[var(--portal-label-text)] mb-1">
                  Payment Receipt
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Upload className="h-5 w-5 text-gold-500/50" />
                  </div>
                  <input
                    id="paymentReceipt"
                    type="file"
                    accept="image/*,.pdf"
                    {...signUpForm.register('paymentReceipt')}
                    className="dark-input w-full pl-10 py-3 rounded-xl border-[var(--portal-input-border)] focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200"
                  />
                </div>
                {signUpForm.formState.errors.paymentReceipt && (
                  <p className="mt-1 text-sm text-red-500">
                    {String(signUpForm.formState.errors.paymentReceipt.message)}
                  </p>
                )}
                <p className="mt-1 text-xs text-[var(--portal-text-secondary)]">
                  Upload your payment receipt (max 5MB, PDF or image)
                </p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full gradient-btn py-3 rounded-xl text-base font-medium shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing Up...' : 'Create Account'}
                </Button>
              </motion.div>
            </motion.form>
          )}

          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
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
