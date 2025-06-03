
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye, Download, User, Phone, Briefcase } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createSlug } from '@/lib/formatters';

interface PendingSignup {
  id: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  career?: string;
  payment_receipt_url?: string;
  status: string;
  created_at: string;
  user_id: string;
}

const AdminPendingSignupsPage = () => {
  const [pendingSignups, setPendingSignups] = useState<PendingSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingSignups = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingSignups(data || []);
    } catch (error) {
      console.error('Error fetching pending signups:', error);
      toast({
        title: "Error",
        description: "Failed to load pending signups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSignups();
  }, []);

  const handleApproval = async (profileId: string, firstName: string, lastName: string) => {
    try {
      // Generate unique slug
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_unique_slug', {
          first_name: firstName,
          last_name: lastName
        });

      if (slugError) throw slugError;

      // Update profile status and add slug
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'approved',
          slug: slugData
        })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Agent approved successfully",
      });

      fetchPendingSignups();
    } catch (error) {
      console.error('Error approving agent:', error);
      toast({
        title: "Error",
        description: "Failed to approve agent",
        variant: "destructive",
      });
    }
  };

  const handleRejection = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Agent rejected successfully",
      });

      fetchPendingSignups();
    } catch (error) {
      console.error('Error rejecting agent:', error);
      toast({
        title: "Error",
        description: "Failed to reject agent",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AdminSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
                <p className="text-[var(--portal-text-secondary)]">Loading pending signups...</p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <SidebarInset>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="ml-4 text-xl font-semibold">Pending Signups</h1>
            </div>
            <Badge variant="secondary">
              {pendingSignups.length} Pending
            </Badge>
          </div>
          
          <div className="p-6">
            {pendingSignups.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <User className="h-16 w-16 text-[var(--portal-text-secondary)]/20 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Pending Signups</h3>
                  <p className="text-[var(--portal-text-secondary)]">
                    All signup requests have been processed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {pendingSignups.map((signup) => (
                  <Card key={signup.id} className="bg-[var(--portal-card-bg)] border-[var(--portal-border)]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-gold-500">
                          {signup.first_name} {signup.last_name}
                        </CardTitle>
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                          Pending Review
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[var(--portal-text-secondary)]" />
                            <span className="text-sm text-[var(--portal-text-secondary)]">Name:</span>
                            <span className="font-medium">{signup.first_name} {signup.last_name}</span>
                          </div>
                          
                          {signup.phone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-[var(--portal-text-secondary)]" />
                              <span className="text-sm text-[var(--portal-text-secondary)]">Phone:</span>
                              <span className="font-medium">{signup.phone_number}</span>
                            </div>
                          )}
                          
                          {signup.career && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-[var(--portal-text-secondary)]" />
                              <span className="text-sm text-[var(--portal-text-secondary)]">Career:</span>
                              <span className="font-medium">{signup.career}</span>
                            </div>
                          )}
                          
                          <div>
                            <span className="text-sm text-[var(--portal-text-secondary)]">Signup Date:</span>
                            <span className="font-medium ml-2">
                              {new Date(signup.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {signup.payment_receipt_url && (
                            <div>
                              <span className="text-sm text-[var(--portal-text-secondary)] block mb-2">Payment Receipt:</span>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(signup.payment_receipt_url, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = signup.payment_receipt_url!;
                                    link.download = `receipt-${signup.first_name}-${signup.last_name}`;
                                    link.click();
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-2 pt-4">
                            <Button
                              onClick={() => handleApproval(signup.id, signup.first_name, signup.last_name)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleRejection(signup.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminPendingSignupsPage;
