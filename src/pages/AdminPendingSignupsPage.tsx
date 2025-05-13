import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/AdminSidebar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, CheckCircle, XCircle, ExternalLink, Eye } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

interface UserData {
  id: string;
  email: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    payment_receipt_url: string | null;
    career: string | null;
    status: string;
    updated_at: string;
  } | null;
}

const AdminPendingSignupsPage = () => {
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      // Get users with agent role
      const { data: userData, error: userError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role
        `)
        .eq('role', 'agent');

      if (userError) throw userError;

      if (!userData || userData.length === 0) {
        setLoading(false);
        setPendingUsers([]);
        return;
      }

      const userIds = userData.map(item => item.user_id);
      
      // Get profiles with pending_approval status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending_approval')
        .in('id', userIds);

      if (profileError) throw profileError;

      // If no pending profiles, return early
      if (!profileData || profileData.length === 0) {
        setLoading(false);
        setPendingUsers([]);
        return;
      }

      // Get emails from auth.users
      const { data: authUsersData, error: authUsersError } = await supabase
        .rpc('get_auth_users_data');

      if (authUsersError) throw authUsersError;

      // Combine data
      const pendingSignups = profileData.map(profile => {
        const authUser = authUsersData.find((user: any) => user.id === profile.id);
        return {
          id: profile.id,
          email: authUser?.email || 'No email found',
          profile: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            phone_number: profile.phone_number,
            payment_receipt_url: profile.payment_receipt_url,
            career: profile.career,
            status: profile.status,
            updated_at: profile.updated_at,
          }
        };
      });

      setPendingUsers(pendingSignups);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    setApproving(userId);
    try {
      // Update the profile status to approved
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', userId);

      if (error) throw error;

      // Remove the approved user from the list and show success message
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('User approved successfully');
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast.error(`Error approving user: ${error.message}`);
    } finally {
      setApproving(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    setRejecting(userId);
    try {
      // Delete the user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Delete the user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Remove from state
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('User rejected and removed');
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      toast.error(`Error rejecting user: ${error.message}`);
    } finally {
      setRejecting(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const showUserDetailsModal = (user: UserData) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-2xl font-semibold">Pending Signups</h1>
            <Button onClick={() => navigate('/admin')}>Back to Dashboard</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending User Approvals</CardTitle>
              <CardDescription>
                Review and approve new agent signups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending signups found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Career</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Signup Date</TableHead>
                      <TableHead>Payment Receipt</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.profile?.first_name || ''} {user.profile?.last_name || ''}{' '}
                          {!user.profile?.first_name && !user.profile?.last_name && 'No name provided'}
                        </TableCell>
                        <TableCell>{user.email || 'No email'}</TableCell>
                        <TableCell>{user.profile?.career || 'Not provided'}</TableCell>
                        <TableCell>{user.profile?.phone_number || 'Not provided'}</TableCell>
                        <TableCell>{formatDate(user.profile?.updated_at || '')}</TableCell>
                        <TableCell>
                          {user.profile?.payment_receipt_url ? (
                            <a 
                              href={user.profile.payment_receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              View <ExternalLink className="ml-1 h-4 w-4" />
                            </a>
                          ) : (
                            'Not uploaded'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => showUserDetailsModal(user)}
                            >
                              <Eye className="h-4 w-4 mr-1" /> Details
                            </Button>
                            
                            <Button 
                              onClick={() => handleApproveUser(user.id)}
                              disabled={approving === user.id}
                              variant="outline" 
                              size="sm"
                              className="text-green-600"
                            >
                              {approving === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              )}
                              Approve
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the user's account.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleRejectUser(user.id)}
                                    disabled={rejecting === user.id}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {rejecting === user.id && (
                                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    )}
                                    Reject
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>

        {/* User Details Dialog */}
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Complete information about the user
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                    <p className="text-base">
                      {selectedUser.profile?.first_name || ''} {selectedUser.profile?.last_name || ''}
                      {!selectedUser.profile?.first_name && !selectedUser.profile?.last_name && 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="text-base">{selectedUser.email || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="text-base">{selectedUser.profile?.phone_number || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Career</h3>
                    <p className="text-base">{selectedUser.profile?.career || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Signup Date</h3>
                    <p className="text-base">{formatDate(selectedUser.profile?.updated_at || '')}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className="text-base capitalize">{selectedUser.profile?.status || 'Unknown'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Receipt</h3>
                  {selectedUser.profile?.payment_receipt_url ? (
                    <div className="space-y-2">
                      <div className="border rounded p-2">
                        <a
                          href={selectedUser.profile.payment_receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          View Receipt <ExternalLink className="ml-1 h-4 w-4" />
                        </a>
                      </div>
                      {selectedUser.profile.payment_receipt_url.endsWith('.jpg') || 
                       selectedUser.profile.payment_receipt_url.endsWith('.jpeg') || 
                       selectedUser.profile.payment_receipt_url.endsWith('.png') ? (
                        <div className="border rounded p-2">
                          <img 
                            src={selectedUser.profile.payment_receipt_url} 
                            alt="Payment Receipt" 
                            className="max-h-48 mx-auto"
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-base text-gray-500">No payment receipt uploaded</p>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <div className="flex gap-2">
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (selectedUser) {
                      handleRejectUser(selectedUser.id);
                      setShowUserDetails(false);
                    }
                  }}
                  disabled={selectedUser ? rejecting === selectedUser.id : false}
                >
                  {selectedUser && rejecting === selectedUser.id && (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  )}
                  Reject User
                </Button>
                <Button 
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    if (selectedUser) {
                      handleApproveUser(selectedUser.id);
                      setShowUserDetails(false);
                    }
                  }}
                  disabled={selectedUser ? approving === selectedUser.id : false}
                >
                  {selectedUser && approving === selectedUser.id && (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  )}
                  Approve User
                </Button>
              </div>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default AdminPendingSignupsPage;
