
import React, { useEffect, useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/AdminSidebar';
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type PendingUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  career: string;
  payment_receipt_url: string;
  created_at: string;
};

const AdminPendingSignupsPage = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      // Get users with pending_approval status
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending_approval');
      
      if (profilesError) throw profilesError;
      
      if (!profiles || profiles.length === 0) {
        setPendingUsers([]);
        setLoading(false);
        return;
      }
      
      const userIds = profiles.map(p => p.id);
      
      // Get user emails from auth.users
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, created_at')
        .in('id', userIds);
      
      if (authError) {
        // Fall back to just using the profiles data without emails
        console.error('Could not fetch user emails:', authError);
        
        const usersWithoutEmails = profiles.map(profile => ({
          id: profile.id,
          email: 'Email not available',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone_number: profile.phone_number || '',
          career: profile.career || '',
          payment_receipt_url: profile.payment_receipt_url || '',
          created_at: 'Unknown'
        }));
        
        setPendingUsers(usersWithoutEmails);
        setLoading(false);
        return;
      }
      
      // Combine all data
      const combinedUsers = profiles.map(profile => {
        const authUser = authUsers?.find(u => u.id === profile.id);
        
        return {
          id: profile.id,
          email: authUser?.email || 'Email not available',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone_number: profile.phone_number || '',
          career: profile.career || '',
          payment_receipt_url: profile.payment_receipt_url || '',
          created_at: authUser?.created_at ? authUser.created_at : 'Unknown'
        };
      });
      
      setPendingUsers(combinedUsers);
    } catch (error: any) {
      toast.error(`Error loading pending signups: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      toast.success(`User ${selectedUser.first_name} ${selectedUser.last_name} approved`);
      fetchPendingUsers();
    } catch (error: any) {
      toast.error(`Error approving user: ${error.message}`);
    } finally {
      setApproveDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    
    try {
      // Delete user from auth (this will cascade delete their related data)
      const { error } = await supabase.auth.admin.deleteUser(
        selectedUser.id
      );
      
      if (error) throw error;
      
      toast.success(`User ${selectedUser.first_name} ${selectedUser.last_name} rejected`);
      fetchPendingUsers();
    } catch (error: any) {
      toast.error(`Error rejecting user: ${error.message}`);
    } finally {
      setRejectDialogOpen(false);
      setSelectedUser(null);
    }
  };

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
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-10">Loading...</div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-10">No pending signups found</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingUsers.map(user => (
                  <Card key={user.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {user.first_name} {user.last_name}
                        </CardTitle>
                        <Badge className="bg-yellow-500">Pending</Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Email</div>
                        <div>{user.email}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-500">Phone</div>
                        <div>{user.phone_number}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-500">Career</div>
                        <div className="max-h-20 overflow-y-auto">{user.career}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-500">Submitted</div>
                        <div>
                          {user.created_at !== 'Unknown' 
                            ? format(new Date(user.created_at), 'MMM d, yyyy')
                            : 'Unknown'
                          }
                        </div>
                      </div>
                      
                      {user.payment_receipt_url && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Payment Receipt</div>
                          <div className="mt-1">
                            <a 
                              href={user.payment_receipt_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              View Receipt
                            </a>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="flex gap-2 justify-between pt-2">
                      <Button 
                        variant="outline" 
                        className="w-1/2"
                        onClick={() => {
                          setSelectedUser(user);
                          setRejectDialogOpen(true);
                        }}
                      >
                        Reject
                      </Button>
                      <Button 
                        className="w-1/2"
                        onClick={() => {
                          setSelectedUser(user);
                          setApproveDialogOpen(true);
                        }}
                      >
                        Approve
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Approve Confirmation Dialog */}
          <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to approve {selectedUser?.first_name} {selectedUser?.last_name}? 
                  They will gain access to the agent dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleApprove}>
                  Approve
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Reject Confirmation Dialog */}
          <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reject {selectedUser?.first_name} {selectedUser?.last_name}?
                  This will permanently delete their account and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
                  Reject
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminPendingSignupsPage;
