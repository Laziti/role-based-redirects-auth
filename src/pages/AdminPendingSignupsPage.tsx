
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

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
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Error approving user');
    } finally {
      setApproving(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    setRejecting(userId);
    try {
      // Delete the user's profile (this will cascade to auth.users due to references)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Remove from state
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('User rejected and removed');
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Error rejecting user');
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

  return (
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
                            onClick={() => handleApproveUser(user.id)}
                            disabled={approving === user.id}
                            variant="outline" 
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
    </div>
  );
};

export default AdminPendingSignupsPage;
