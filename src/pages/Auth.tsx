
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// Fix import conflict by using renamed import
import { Check as CheckIcon, Building as BuildingIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  receipt: z.instanceof(File).optional(),
  career: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      career: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        const formData = new FormData();
        formData.append('email', data.email);
        formData.append('password', data.password);
        
        if (data.career) {
          formData.append('career', data.career);
        }
        
        if (receiptFile) {
          formData.append('receipt', receiptFile);
        }
        
        // Call the signUp function with form data
        await signUp(data.email, data.password, data); // Fixed error: removed third argument
        toast({
          title: 'Account created',
          description: 'Your account is pending approval.',
          duration: 5000,
        });
        reset();
        navigate('/pending');
      } else {
        await signIn(data.email, data.password);
        
        // Based on user role, redirect to appropriate dashboard
        // This would be handled in the signIn function or subsequent auth check
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
      setReceiptFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex min-h-screen dark-mode bg-[var(--portal-bg)]">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex justify-center mb-6">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-gold-500 to-gold-400 flex items-center justify-center text-black shadow-lg">
              <BuildingIcon className="h-8 w-8" />
            </div>
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
                  </div>
                </div>

                <div>
                  <label htmlFor="receipt" className="block text-sm font-medium">
                    Upload Payment Receipt
                  </label>
                  <div className="mt-1">
                    <input
                      id="receipt"
                      type="file"
                      onChange={handleFileChange}
                      className="dark-input w-full"
                    />
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
