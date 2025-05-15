import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import '@/styles/portal-theme.css';

const Auth = () => {
  const navigate = useNavigate();
  const { user, userRole, userStatus, signIn, signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [career, setCareer] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Redirect authenticated users to appropriate portal
  useEffect(() => {
    if (user && userRole) {
      if (userRole === 'super_admin') {
        navigate('/admin');
      } else if (userRole === 'agent') {
        if (userStatus === 'approved') {
          navigate('/agent');
        } else {
          navigate('/pending');
        }
      }
    }
  }, [user, userRole, userStatus, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await signIn(email, password);
      // Navigation will be handled by the useEffect above
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to sign in');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email || !password || !confirmPassword || !name || !phoneNumber || !career || !paymentReceipt) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await signUp(email, password, {
        name,
        phone: phoneNumber,
        career,
        receipt_path: 'pending_upload'
      });
      
      toast.success('Sign up successful. Please wait for admin approval.');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to sign up');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPaymentReceipt(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--portal-bg)]">
      <motion.div 
        className="w-full max-w-md p-6 bg-[var(--portal-card-bg)] rounded-lg shadow-md border border-[var(--portal-border)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center mb-6">
          <div className="h-12 w-12 bg-[var(--portal-accent)] rounded-lg flex items-center justify-center shadow-lg shadow-[var(--portal-accent-glow)]">
            <Building className="h-6 w-6 text-black" />
          </div>
          <h2 className="text-2xl font-bold ml-3 text-[var(--portal-text)]">
            {isLoginMode ? 'Sign In' : 'Sign Up'}
          </h2>
        </div>

        <form onSubmit={isLoginMode ? handleLogin : handleSignUp}>
          {!isLoginMode && (
            <>
              <div className="mb-4">
                <Label htmlFor="name" className="block text-sm font-medium text-[var(--portal-text)]">
                  Full Name
                </Label>
                <Input
                  type="text"
                  id="name"
                  className="mt-1 w-full rounded-md shadow-sm bg-[var(--portal-input-bg)] border-[var(--portal-border)] text-[var(--portal-text)] focus:border-[var(--portal-accent)] focus:ring-[var(--portal-accent)]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="phoneNumber" className="block text-sm font-medium text-[var(--portal-text)]">
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  id="phoneNumber"
                  className="mt-1 w-full rounded-md shadow-sm bg-[var(--portal-input-bg)] border-[var(--portal-border)] text-[var(--portal-text)] focus:border-[var(--portal-accent)] focus:ring-[var(--portal-accent)]"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="career" className="block text-sm font-medium text-[var(--portal-text)]">
                  Career
                </Label>
                <Input
                  type="text"
                  id="career"
                  className="mt-1 w-full rounded-md shadow-sm bg-[var(--portal-input-bg)] border-[var(--portal-border)] text-[var(--portal-text)] focus:border-[var(--portal-accent)] focus:ring-[var(--portal-accent)]"
                  value={career}
                  onChange={(e) => setCareer(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="paymentReceipt" className="block text-sm font-medium text-[var(--portal-text)]">
                  Payment Receipt
                </Label>
                <Input
                  type="file"
                  id="paymentReceipt"
                  className="mt-1 w-full rounded-md shadow-sm bg-[var(--portal-input-bg)] border-[var(--portal-border)] text-[var(--portal-text)] focus:border-[var(--portal-accent)] focus:ring-[var(--portal-accent)]"
                  onChange={handleFileChange}
                  required
                />
              </div>
            </>
          )}
          <div className="mb-4">
            <Label htmlFor="email" className="block text-sm font-medium text-[var(--portal-text)]">
              Email
            </Label>
            <Input
              type="email"
              id="email"
              className="mt-1 w-full rounded-md shadow-sm bg-[var(--portal-input-bg)] border-[var(--portal-border)] text-[var(--portal-text)] focus:border-[var(--portal-accent)] focus:ring-[var(--portal-accent)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <Label htmlFor="password" className="block text-sm font-medium text-[var(--portal-text)]">
              Password
            </Label>
            <Input
              type="password"
              id="password"
              className="mt-1 w-full rounded-md shadow-sm bg-[var(--portal-input-bg)] border-[var(--portal-border)] text-[var(--portal-text)] focus:border-[var(--portal-accent)] focus:ring-[var(--portal-accent)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {!isLoginMode && (
            <div className="mb-6">
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--portal-text)]">
                Confirm Password
              </Label>
              <Input
                type="password"
                id="confirmPassword"
                className="mt-1 w-full rounded-md shadow-sm bg-[var(--portal-input-bg)] border-[var(--portal-border)] text-[var(--portal-text)] focus:border-[var(--portal-accent)] focus:ring-[var(--portal-accent)]"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}
          <div>
            <Button 
              type="submit" 
              className="w-full bg-[var(--portal-accent)] text-black hover:bg-[var(--portal-accent)]/90 transition-all"
              disabled={loading}
            >
              {loading ? 'Loading...' : isLoginMode ? 'Sign In' : 'Sign Up'}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="#"
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-sm text-[var(--portal-accent)] hover:underline"
          >
            {isLoginMode ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
