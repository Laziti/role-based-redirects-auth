
import React, { useEffect, useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/AdminSidebar';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type ListingLimit = {
  type: 'day' | 'week' | 'month' | 'year' | 'unlimited';
  value?: number;
}

type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  status: string;
  created_at: string;
  listing_count: number;
  listing_limit?: ListingLimit;
};

type LimitFormValues = {
  type: 'day' | 'week' | 'month' | 'year' | 'unlimited';
  value: number;
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  
  const form = useForm<LimitFormValues>({
    defaultValues: {
      type: 'month',
      value: 5
    }
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get users with role = agent
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'agent');
      
      if (rolesError) throw rolesError;
      
      if (!userRoles || userRoles.length === 0) {
        setUsers([]);
        return;
      }
      
      const userIds = userRoles.map(ur => ur.user_id);
      
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Count listings per user
      const listingCounts = await Promise.all(
        userIds.map(async (userId) => {
          const { count, error } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          
          return { userId, count: count || 0 };
        })
      );
      
      // Combine all data
      const combinedUsers = profiles.map(profile => {
        const listingData = listingCounts.find(l => l.userId === profile.id);
        let listingLimit: ListingLimit | undefined = undefined;

        if (profile.listing_limit) {
          const limit = profile.listing_limit as any;
          if (limit.type === 'unlimited') {
            listingLimit = { type: 'unlimited' };
          } else if (limit.type && limit.value) {
            listingLimit = { 
              type: limit.type as 'day' | 'week' | 'month' | 'year', 
              value: Number(limit.value)
            };
          }
        }
        
        return {
          id: profile.id,
          email: 'Email not available', // Default
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone_number: profile.phone_number || '',
          status: profile.status || '',
          created_at: profile.updated_at || new Date().toISOString(),
          listing_count: listingData?.count || 0,
          listing_limit: listingLimit
        };
      });
      
      setUsers(combinedUsers);
    } catch (error: any) {
      toast.error(`Error loading users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      // Delete the profiles and user_roles entries
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);
        
      if (profileError) throw profileError;
      
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id);
        
      if (roleError) throw roleError;
      
      toast.success(`User ${selectedUser.first_name} ${selectedUser.last_name} deleted`);
      fetchUsers();
    } catch (error: any) {
      toast.error(`Error deleting user: ${error.message}`);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleLimitSubmit = async (values: LimitFormValues) => {
    if (!selectedUser) return;
    
    try {
      const limitData = values.type === 'unlimited' 
        ? { type: 'unlimited' } 
        : { type: values.type, value: values.value };
      
      const { error } = await supabase
        .from('profiles')
        .update({ listing_limit: limitData })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      toast.success(`Listing limit updated for ${selectedUser.first_name} ${selectedUser.last_name}`);
      fetchUsers();
    } catch (error: any) {
      toast.error(`Error updating limit: ${error.message}`);
    } finally {
      setLimitDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const openLimitDialog = (user: User) => {
    setSelectedUser(user);
    
    // Set form default values based on user's current limit
    if (user.listing_limit) {
      form.reset({
        type: user.listing_limit.type || 'month',
        value: user.listing_limit.value || 5
      });
    } else {
      form.reset({ type: 'month', value: 5 });
    }
    
    setLimitDialogOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <SidebarInset>
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="ml-4 text-xl font-semibold">Users Management</h1>
            </div>
          </div>
          
          <div className="p-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Listings</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No users found</TableCell>
                    </TableRow>
                  ) : (
                    users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone_number}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.created_at 
                            ? format(new Date(user.created_at), 'MMM d, yyyy')
                            : 'Unknown'
                          }
                        </TableCell>
                        <TableCell>{user.listing_count}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openLimitDialog(user)}
                            >
                              Set Limit
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the user {selectedUser?.first_name} {selectedUser?.last_name} and all their data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Set Limit Dialog */}
          <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Listing Limit</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleLimitSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limit Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select limit type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="day">Per Day</SelectItem>
                            <SelectItem value="week">Per Week</SelectItem>
                            <SelectItem value="month">Per Month</SelectItem>
                            <SelectItem value="year">Per Year</SelectItem>
                            <SelectItem value="unlimited">Unlimited</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('type') !== 'unlimited' && (
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Listings</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setLimitDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminUsersPage;
