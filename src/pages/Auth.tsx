import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check as CheckIcon, Building as BuildingIcon, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
          toast({
            variant: 'destructive',
            title: 'Missing receipt',
            description: 'Please upload a payment receipt to continue.',
            duration: 5000,
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
        
        toast({
          title: 'Account created',
          description: 'Your account is pending approval.',
          duration: 5000,
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
        
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        variant: 'destructive',
        title: 'Authentication failed',
        description: error.message || 'Please check your credentials and try again.',
        duration: 5000,
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
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'The receipt file must be less than 5MB.',
          duration: 5000,
        });
        return;
      }
      
      // Check file type (image or PDF)
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please upload an image (JPG, PNG) or PDF file.',
          duration: 5000,
        });
        return;
      }
      
      setReceiptFile(file);
    }
  };

  return (
    <div className="flex min-h-screen dark-mode bg-[var(--portal-bg)]">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex flex-col items-center mb-6">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-gold-500 to-gold-400 flex items-center justify-center text-black shadow-lg mb-4">
              <BuildingIcon className="h-8 w-8" />
            </div>
            <Link 
              to="/" 
              className="text-sm text-gold-400 hover:text-gold-500 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
          <h2 className="text-3xl font-extrabold text-center gradient-text">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="dark-input w-full"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  className="dark-input w-full"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            </div>

            {isSignUp && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium">
                      First Name
                    </label>
                    <div className="mt-1">
                      <input
                        id="firstName"
                        type="text"
                        {...register('firstName')}
                        className="dark-input w-full"
                        placeholder="John"
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium">
                      Last Name
                    </label>
                    <div className="mt-1">
                      <input
                        id="lastName"
                        type="text"
                        {...register('lastName')}
                        className="dark-input w-full"
                        placeholder="Doe"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium">
                    Phone Number
                  </label>
                  <div className="mt-1">
                    <input
                      id="phoneNumber"
                      type="tel"
                      {...register('phoneNumber')}
                      className="dark-input w-full"
                      placeholder="+1234567890"
                    />
                    {errors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-500">{errors.phoneNumber.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="career" className="block text-sm font-medium">
                    Career
                  </label>
                  <div className="mt-1">
                    <input
                      id="career"
                      type="text"
                      {...register('career')}
                      className="dark-input w-full"
                      placeholder="Real Estate Agent"
                    />
                    {errors.career && (
                      <p className="mt-1 text-sm text-red-500">{errors.career.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="receipt" className="block text-sm font-medium">
                    Upload Payment Receipt (Max 5MB - Image or PDF)
                  </label>
                  <div className="mt-1">
                    <input
                      id="receipt"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      onChange={handleFileChange}
                      className="dark-input w-full"
                    />
                    {receiptFile && (
                      <p className="mt-1 text-sm text-green-500">
                        File selected: {receiptFile.name}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-gold-400">
                      Upload proof of payment to proceed with registration.
                    </p>
                  </div>
                </div>
              </>
            )}

            <div>
              <Button
                type="submit"
                className="w-full gradient-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>{isSignUp ? 'Sign Up' : 'Sign In'}</>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                reset();
                setReceiptFile(null);
              }}
              className="text-sm text-gold-400 hover:text-gold-500"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
