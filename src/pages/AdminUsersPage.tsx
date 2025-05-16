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
import { Input } from '@/components/ui/input';
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
import { Input as FormInput } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import UserEditModal from '@/components/admin/UserEditModal';
import UserDetailsModal from '@/components/admin/UserDetailsModal';

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
  career: string;
  listing_count: number;
  listing_limit?: ListingLimit;
};

type LimitFormValues = {
  type: 'day' | 'week' | 'month' | 'year' | 'unlimited';
  value: number;
};

type FilterOptions = {
  status: 'all' | 'approved' | 'pending_approval';
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({ status: 'all' });
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  
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
        .select('user_id, role')
        .eq('role', 'agent');
      
      if (rolesError) throw rolesError;
      
      if (!userRoles || userRoles.length === 0) {
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }
      
      const userIds = userRoles.map(ur => ur.user_id);
      
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      if (!profiles) {
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }

      // Get emails from auth.users
      const { data: authUsersData, error: authUsersError } = await supabase
        .rpc('get_auth_users_data');

      if (authUsersError) throw authUsersError;
      
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
      const combinedUsers: User[] = profiles.map(profile => {
        const listingData = listingCounts.find(l => l.userId === profile.id);
        const authUser = authUsersData?.find((u: any) => u.id === profile.id);
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
          email: authUser?.email || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone_number: profile.phone_number || '',
          status: profile.status || '',
          created_at: profile.updated_at || new Date().toISOString(),
          career: profile.career || '',
          listing_count: listingData?.count || 0,
          listing_limit: listingLimit
        };
      });
      
      setUsers(combinedUsers);
      applyFilters(combinedUsers, searchTerm, filters);
    } catch (error: any) {
      toast.error({ 
        title: 'Error loading users',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (userList: User[], search: string, filterOptions: FilterOptions) => {
    let filtered = [...userList];
    
    // Apply status filter
    if (filterOptions.status !== 'all') {
      filtered = filtered.filter(user => user.status === filterOptions.status);
    }
    
    // Apply search
    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        user => 
          `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchLower) || 
          user.phone_number?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredUsers(filtered);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters(users, searchTerm, filters);
  }, [searchTerm, filters]);

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      // Delete the profiles entry
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);
        
      if (profileError) throw profileError;
      
      // Delete user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id);
        
      if (roleError) throw roleError;
      
      toast.success({ 
        title: 'User deleted',
        description: `${selectedUser.first_name} ${selectedUser.last_name} has been deleted`
      });
      fetchUsers();
    } catch (error: any) {
      toast.error({ 
        title: 'Error deleting user',
        description: error.message
      });
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
      
      toast.success({ 
        title: 'Listing limit updated',
        description: `Updated listing limit for ${selectedUser.first_name} ${selectedUser.last_name}`
      });
      fetchUsers();
    } catch (error: any) {
      toast.error({ 
        title: 'Error updating limit',
        description: error.message
      });
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

  const renderLimitBadge = (limit?: ListingLimit) => {
    if (!limit) return 'Default (5/month)';
    
    if (limit.type === 'unlimited') {
      return <Badge variant="outline" className="bg-blue-50">Unlimited</Badge>;
    }
    
    return (
      <Badge variant="outline" className="bg-green-50">
        {limit.value}/{limit.type}
      </Badge>
    );
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const openDetailsDialog = (user: User) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  const handleFilterChange = (status: 'all' | 'approved' | 'pending_approval') => {
    setFilters(prev => ({ ...prev, status }));
    setFilterMenuOpen(false);
  };

  const clearFilters = () => {
    setFilters({ status: 'all' });
    setSearchTerm('');
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
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </Button>
                  
                  {filterMenuOpen && (
                    <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="p-2">
                        <div className="px-2 py-1 text-sm font-semibold">Status</div>
                        <button 
                          className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 
                            ${filters.status === 'all' ? 'bg-gray-100 font-medium' : ''}`}
                          onClick={() => handleFilterChange('all')}
                        >
                          All
                        </button>
                        <button 
                          className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 
                            ${filters.status === 'approved' ? 'bg-gray-100 font-medium' : ''}`}
                          onClick={() => handleFilterChange('approved')}
                        >
                          Approved
                        </button>
                        <button 
                          className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 
                            ${filters.status === 'pending_approval' ? 'bg-gray-100 font-medium' : ''}`}
                          onClick={() => handleFilterChange('pending_approval')}
                        >
                          Pending
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {(searchTerm || filters.status !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" /> Clear
                  </Button>
                )}
                
                <Button onClick={fetchUsers} size="sm" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Career</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Listings</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Listing Limit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6">No users found</TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : "No name provided"}
                        </TableCell>
                        <TableCell>{user.email || 'No email'}</TableCell>
                        <TableCell>{user.phone_number || 'No phone'}</TableCell>
                        <TableCell>{user.career || 'Not specified'}</TableCell>
                        <TableCell>
                          <div className={`px-2 py-1 rounded text-xs inline-block ${
                            user.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.status === 'approved' ? 'Approved' : 'Pending'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{user.listing_count}</TableCell>
                        <TableCell>
                          {user.created_at 
                            ? format(new Date(user.created_at), 'MMM d, yyyy')
                            : 'Unknown'
                          }
                        </TableCell>
                        <TableCell>{renderLimitBadge(user.listing_limit)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openDetailsDialog(user)}
                            >
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              Edit
                            </Button>
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
                            <FormInput 
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

          {/* Edit User Dialog */}
          {selectedUser && (
            <UserEditModal 
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              user={selectedUser}
              onSuccess={fetchUsers}
            />
          )}

          {/* View User Details Dialog */}
          {selectedUser && (
            <UserDetailsModal
              open={detailsDialogOpen}
              onOpenChange={setDetailsDialogOpen}
              user={selectedUser}
            />
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminUsersPage;
