
import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { User, LogIn, UserPlus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import '@/styles/portal-theme.css';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(6, 'Phone number must be at least 6 characters'),
  career: z.string().min(2, 'Career must be at least 2 characters'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Auth = () => {
  const [authType, setAuthType] = useState<string>('login');
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      career: '',
      email: '',
      password: '',
    },
  });

  const onLoginSubmit = async (data) => {
    setLoading(true);
    try {
      await signIn(data.email, data.password);
      // Navigation is handled in AuthContext after successful login
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to sign in. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSignupSubmit = async (data) => {
    if (!receiptFile) {
      toast.error('Please upload payment receipt');
      return;
    }

    setLoading(true);
    try {
      await signUp({
        email: data.email,
        password: data.password,
        full_name: data.fullName,
        phone: data.phone,
        career: data.career,
        receiptFile,
      });
      
      toast.success('Signup successful! Please wait for admin approval.');
      navigate('/pending');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      }
    }
  };

  const itemAnimation = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row portal-layout">
      {/* Left panel (Hero) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#0F0F0F] to-[#1A1A1A] p-12 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md"
        >
          <div className="h-16 w-16 bg-[var(--portal-accent)] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[var(--portal-accent-glow)]">
            <Building className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[var(--portal-text)] to-[var(--portal-accent)] bg-clip-text text-transparent">
            Real Estate Listing Platform
          </h1>
          <p className="text-[var(--portal-text-secondary)] text-lg mb-8">
            Create, manage, and share your property listings with our premium platform designed for real estate professionals.
          </p>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-[var(--portal-accent)]/10 p-2 rounded-lg mt-1">
                <Check className="h-5 w-5 text-[var(--portal-accent)]" />
              </div>
              <div>
                <h3 className="font-medium text-[var(--portal-text)]">Trusted by Professionals</h3>
                <p className="text-[var(--portal-text-secondary)]">Join hundreds of real estate agents using our platform</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-[var(--portal-accent)]/10 p-2 rounded-lg mt-1">
                <Check className="h-5 w-5 text-[var(--portal-accent)]" />
              </div>
              <div>
                <h3 className="font-medium text-[var(--portal-text)]">Simple & Direct</h3>
                <p className="text-[var(--portal-text-secondary)]">Create listings in minutes and share with clients</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-[var(--portal-accent)]/10 p-2 rounded-lg mt-1">
                <Check className="h-5 w-5 text-[var(--portal-accent)]" />
              </div>
              <div>
                <h3 className="font-medium text-[var(--portal-text)]">Affordable Solution</h3>
                <p className="text-[var(--portal-text-secondary)]">Only 5000 birr/month for up to 100 listings</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right panel (Authentication) */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-0">
        <motion.div
          variants={containerAnimation}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <motion.div variants={itemAnimation} className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-[var(--portal-accent)]">
              {authType === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="mt-2 text-[var(--portal-text-secondary)]">
              {authType === 'login' ? 'Sign in to your account to continue' : 'Sign up as a new agent to get started'}
            </p>
          </motion.div>

          <Tabs value={authType} onValueChange={setAuthType} className="w-full">
            <motion.div variants={itemAnimation}>
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login" className="data-[state=active]:bg-[var(--portal-accent)] data-[state=active]:text-black">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-[var(--portal-accent)] data-[state=active]:text-black">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <AnimatePresence mode="wait">
              <TabsContent value="login" className="mt-0">
                <motion.form
                  variants={containerAnimation}
                  initial="hidden"
                  animate="visible"
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className="space-y-6"
                >
                  <motion.div variants={itemAnimation} className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="you@example.com" 
                      className="portal-input"
                      {...loginForm.register('email')} 
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-red-500 text-sm">{loginForm.formState.errors.email.message}</p>
                    )}
                  </motion.div>

                  <motion.div variants={itemAnimation} className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="portal-input"
                      {...loginForm.register('password')} 
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-red-500 text-sm">{loginForm.formState.errors.password.message}</p>
                    )}
                  </motion.div>

                  <motion.div variants={itemAnimation}>
                    <Button 
                      type="submit" 
                      className="portal-button w-full"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </motion.div>
                </motion.form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <motion.form
                  variants={containerAnimation}
                  initial="hidden"
                  animate="visible"
                  onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                  className="space-y-4"
                >
                  <motion.div variants={itemAnimation} className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      placeholder="John Doe" 
                      className="portal-input"
                      {...signupForm.register('fullName')} 
                    />
                    {signupForm.formState.errors.fullName && (
                      <p className="text-red-500 text-sm">{signupForm.formState.errors.fullName.message}</p>
                    )}
                  </motion.div>

                  <motion.div variants={itemAnimation} className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      placeholder="+1234567890" 
                      className="portal-input"
                      {...signupForm.register('phone')} 
                    />
                    {signupForm.formState.errors.phone && (
                      <p className="text-red-500 text-sm">{signupForm.formState.errors.phone.message}</p>
                    )}
                  </motion.div>

                  <motion.div variants={itemAnimation} className="space-y-2">
                    <Label htmlFor="career">Career</Label>
                    <Input 
                      id="career" 
                      placeholder="Real Estate Agent" 
                      className="portal-input"
                      {...signupForm.register('career')} 
                    />
                    {signupForm.formState.errors.career && (
                      <p className="text-red-500 text-sm">{signupForm.formState.errors.career.message}</p>
                    )}
                  </motion.div>

                  <motion.div variants={itemAnimation} className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input 
                      id="email-signup" 
                      type="email" 
                      placeholder="you@example.com" 
                      className="portal-input"
                      {...signupForm.register('email')} 
                    />
                    {signupForm.formState.errors.email && (
                      <p className="text-red-500 text-sm">{signupForm.formState.errors.email.message}</p>
                    )}
                  </motion.div>

                  <motion.div variants={itemAnimation} className="space-y-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input 
                      id="password-signup" 
                      type="password" 
                      placeholder="••••••••" 
                      className="portal-input"
                      {...signupForm.register('password')} 
                    />
                    {signupForm.formState.errors.password && (
                      <p className="text-red-500 text-sm">{signupForm.formState.errors.password.message}</p>
                    )}
                  </motion.div>

                  <motion.div variants={itemAnimation} className="space-y-2">
                    <Label htmlFor="receipt">Upload Payment Receipt</Label>
                    <div className="border-2 border-dashed border-[var(--portal-border)] rounded-lg p-4 cursor-pointer hover:border-[var(--portal-accent)] transition-colors">
                      <label htmlFor="receipt" className="flex flex-col items-center justify-center cursor-pointer">
                        <Upload className="h-8 w-8 text-[var(--portal-text-secondary)] mb-2" />
                        <span className="text-sm text-[var(--portal-text-secondary)]">
                          {receiptFile ? receiptFile.name : 'Click to upload payment proof'}
                        </span>
                        <input 
                          id="receipt" 
                          type="file" 
                          accept="image/*,.pdf" 
                          className="hidden" 
                          onChange={handleFileChange} 
                        />
                      </label>
                    </div>
                    {!receiptFile && (
                      <p className="text-[var(--portal-text-secondary)] text-sm">
                        Upload proof of payment (5000 birr/month)
                      </p>
                    )}
                  </motion.div>

                  <motion.div variants={itemAnimation}>
                    <Button 
                      type="submit" 
                      className="portal-button w-full" 
                      disabled={loading}
                    >
                      {loading ? 'Signing up...' : 'Sign Up'}
                    </Button>
                  </motion.div>
                </motion.form>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

const Check = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Building = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M8 10h.01" />
    <path d="M16 10h.01" />
    <path d="M12 10h.01" />
    <path d="M8 14h.01" />
    <path d="M16 14h.01" />
    <path d="M12 14h.01" />
  </svg>
);

export default Auth;
