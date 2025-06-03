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
import { SearchInput } from '@/components/ui/search-input';
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
  DialogFooter,
  DialogTrigger,
  DialogDescription
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
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import UserEditModal from '@/components/admin/UserEditModal';
import UserDetailsModal from '@/components/admin/UserDetailsModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Crown, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ListingLimitType = 'day' | 'week' | 'month' | 'year' | 'unlimited';
type SubscriptionStatus = 'free' | 'pro';

interface ListingLimit {
  type: ListingLimitType;
  value?: number;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  status: 'active' | 'inactive';
  career?: string;
  created_at: string;
  listing_count: number;
  subscription_status: SubscriptionStatus;
  subscription_end?: string;
  listing_limit?: ListingLimit;
  social_links?: Record<string, string>;
}

type LimitFormValues = {
  type: ListingLimitType;
  value?: number;
};

type FilterOptions = {
  status: 'all' | 'active' | 'inactive';
};

interface UserStats {
  freeUsers: number;
  proUsers: number;
  recentUsers: User[];
}

type NewUser = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  subscription_status: 'free' | 'pro';
  subscription_duration: 'monthly' | '6months' | 'yearly';
  listing_limit: {
    type: 'day' | 'week' | 'month' | 'year' | 'unlimited';
    value?: number;
  };
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
  const [stats, setStats] = useState<UserStats>({
    freeUsers: 0,
    proUsers: 0,
    recentUsers: []
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    subscription_status: 'free',
    subscription_duration: 'monthly',
    listing_limit: {
      type: 'month',
      value: 5
    }
  });
  
  const form = useForm<LimitFormValues>({
    defaultValues: {
      type: 'month',
      value: 5
    }
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching profiles...');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      console.log('Profiles data:', profiles);
      console.log('Profiles error:', profilesError);
      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        console.warn('No profiles found');
        setUsers([]);
        return;
      }

      console.log('Fetching auth users data...');
      const { data: authUsersData, error: authUsersError } = await supabase
        .rpc('get_auth_users_data');

      console.log('Auth users data:', authUsersData);
      console.log('Auth users error:', authUsersError);
      if (authUsersError) {
        console.error('Auth users fetch error:', authUsersError);
        throw authUsersError;
      }

      if (!authUsersData || authUsersData.length === 0) {
        console.warn('No auth users data found');
        setUsers([]);
        return;
      }

      console.log('Fetching listing counts...');
      const { data: listingCounts, error: listingCountError } = await supabase
        .from('listings')
        .select('user_id, id')
        .then(result => {
          if (result.error) throw result.error;
          // Count listings per user
          const counts = result.data.reduce((acc: Record<string, number>, curr) => {
            acc[curr.user_id] = (acc[curr.user_id] || 0) + 1;
            return acc;
          }, {});
          return { data: counts, error: null };
        });

      console.log('Listing counts:', listingCounts);
      console.log('Listing count error:', listingCountError);
      if (listingCountError) {
        console.error('Listing count error:', listingCountError);
        throw listingCountError;
      }

      const usersData = profiles.map(profile => {
        const authUser = authUsersData.find((user: any) => user.id === profile.id);
        const listingCount = listingCounts[profile.id] || 0;
        
        let listingLimit: ListingLimit | undefined;
        if (profile.listing_limit) {
          const type = profile.listing_limit.type as ListingLimitType;
          if (type === 'unlimited') {
            listingLimit = { type };
          } else if (type && ['day', 'week', 'month', 'year'].includes(type)) {
            listingLimit = {
              type,
              value: profile.listing_limit.value
            };
          }
        }

        return {
          id: profile.id,
          email: authUser?.email || 'No email found',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone_number: profile.phone_number || '',
          status: (profile.status || 'inactive') as 'active' | 'inactive',
          created_at: profile.updated_at || new Date().toISOString(),
          career: profile.career || '',
          listing_count: listingCount,
          listing_limit: listingLimit,
          subscription_status: (profile.subscription_status || 'free') as SubscriptionStatus,
          subscription_end: profile.subscription_end,
          social_links: profile.social_links || {}
        };
      });

      console.log('Processed users data:', usersData);
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setFilteredUsers([]);
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
      
      fetchUsers();
    } catch (error: any) {
      // No toast notification
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
      
      fetchUsers();
    } catch (error: any) {
      // No toast notification
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

  const renderLimitBadge = (limit?: ListingLimit): React.ReactNode => {
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

  const handleFilterChange = (status: 'all' | 'active' | 'inactive') => {
    setFilters(prev => ({ ...prev, status }));
    setFilterMenuOpen(false);
  };

  const clearFilters = () => {
    setFilters({ status: 'all' });
    setSearchTerm('');
  };

  const fetchUserStats = async () => {
    try {
      // Fetch free users count
      const { count: freeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'free')
        .eq('role', 'agent');

      // Fetch pro users count
      const { count: proCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'pro')
        .eq('role', 'agent');

      // Fetch recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        freeUsers: freeCount || 0,
        proUsers: proCount || 0,
        recentUsers: recentUsers || []
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: 'agent'
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) throw new Error('No user returned from auth signup');

      // Calculate subscription end date if pro
      let subscription_end = null;
      if (newUser.subscription_status === 'pro') {
        const now = new Date();
        switch (newUser.subscription_duration) {
          case 'monthly':
            subscription_end = new Date(now.setMonth(now.getMonth() + 1));
            break;
          case '6months':
            subscription_end = new Date(now.setMonth(now.getMonth() + 6));
            break;
          case 'yearly':
            subscription_end = new Date(now.setFullYear(now.getFullYear() + 1));
            break;
        }
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: 'agent',
          status: 'active',
          subscription_status: newUser.subscription_status,
          subscription_end: subscription_end?.toISOString(),
          listing_limit: newUser.listing_limit.type === 'unlimited' 
            ? { type: 'unlimited' as const }
            : { 
                type: newUser.listing_limit.type as ListingLimitType, 
                value: newUser.listing_limit.value 
              }
        });

      if (profileError) throw profileError;

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'agent'
        });

      if (roleError) throw roleError;

      toast.success('User created successfully');
      setCreateDialogOpen(false);
      fetchUsers(); // Refresh user list
      
      // Reset form
      setNewUser({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        subscription_status: 'free',
        subscription_duration: 'monthly',
        listing_limit: {
          type: 'month',
          value: 5
        }
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete user's listings
      const { error: listingsError } = await supabase
        .from('listings')
        .delete()
        .eq('user_id', userId);
      
      if (listingsError) throw listingsError;
      
      // Delete user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
        
      if (roleError) throw roleError;
      
      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (profileError) throw profileError;
      
      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) throw authError;

      toast.success('User deleted successfully');
      fetchUsers(); // Refresh the list
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
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
              <h1 className="ml-4 text-xl font-semibold">User Management</h1>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gold-500 text-black hover:bg-gold-600">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Create a new agent account with subscription details.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={newUser.first_name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, first_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={newUser.last_name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, last_name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscription">Subscription Type</Label>
                      <Select
                        value={newUser.subscription_status}
                        onValueChange={(value: 'free' | 'pro') => setNewUser(prev => ({ ...prev, subscription_status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subscription type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newUser.subscription_status === 'pro' && (
                      <div className="space-y-2">
                        <Label htmlFor="duration">Subscription Duration</Label>
                        <Select
                          value={newUser.subscription_duration}
                          onValueChange={(value: 'monthly' | '6months' | 'yearly') => setNewUser(prev => ({ ...prev, subscription_duration: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">1 Month</SelectItem>
                            <SelectItem value="6months">6 Months</SelectItem>
                            <SelectItem value="yearly">1 Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="limit_type">Listing Limit Type</Label>
                      <Select
                        value={newUser.listing_limit.type}
                        onValueChange={(value: 'day' | 'week' | 'month' | 'year' | 'unlimited') => 
                          setNewUser(prev => ({
                            ...prev,
                            listing_limit: {
                              ...prev.listing_limit,
                              type: value,
                              value: value === 'unlimited' ? undefined : (prev.listing_limit.value || 5)
                            }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select limit type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Per Day</SelectItem>
                          <SelectItem value="week">Per Week</SelectItem>
                          <SelectItem value="month">Per Month</SelectItem>
                          <SelectItem value="year">Per Year</SelectItem>
                          <SelectItem value="unlimited">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newUser.listing_limit.type !== 'unlimited' && (
                      <div className="space-y-2">
                        <Label htmlFor="limit_value">Listing Limit Value</Label>
                        <Input
                          id="limit_value"
                          type="number"
                          min="1"
                          value={newUser.listing_limit.value}
                          onChange={(e) => setNewUser(prev => ({
                            ...prev,
                            listing_limit: {
                              ...prev.listing_limit,
                              value: parseInt(e.target.value) || 5
                            }
                          }))}
                        />
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={handleCreateUser}
                    disabled={!newUser.email || !newUser.password || !newUser.first_name || !newUser.last_name}
                  >
                    Create User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="p-6 space-y-6 overflow-auto">
            {/* Search and Filter */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              {(filters.status !== 'all' || searchTerm) && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* User Categories */}
            <div className="grid gap-6">
              {/* Pro Users */}
              <Card className="border-[var(--portal-border)] bg-[var(--portal-card-bg)]">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-gold-500" />
                    <CardTitle>Pro Users</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Listing Limit</TableHead>
                          <TableHead>Subscription Ends</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            </TableCell>
                          </TableRow>
                        ) : filteredUsers.filter(user => user.subscription_status === 'pro').length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                              No pro users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers
                            .filter(user => user.subscription_status === 'pro')
                            .map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>
                                  {user.first_name} {user.last_name}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={user.status === 'active' ? 'outline' : 'secondary'} 
                                    className={user.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
                                  >
                                    {user.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{renderLimitBadge(user.listing_limit)}</TableCell>
                                <TableCell>{formatDate(user.subscription_end || '')}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openDetailsDialog(user)}
                                    >
                                      Details
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditDialog(user)}
                                    >
                                      Edit
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Free Users */}
              <Card className="border-[var(--portal-border)] bg-[var(--portal-card-bg)]">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <CardTitle>Free Users</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Listing Limit</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            </TableCell>
                          </TableRow>
                        ) : filteredUsers.filter(user => user.subscription_status === 'free').length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                              No free users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers
                            .filter(user => user.subscription_status === 'free')
                            .map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>
                                  {user.first_name} {user.last_name}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={user.status === 'active' ? 'outline' : 'secondary'} 
                                    className={user.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
                                  >
                                    {user.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{renderLimitBadge(user.listing_limit)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openDetailsDialog(user)}
                                    >
                                      Details
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditDialog(user)}
                                    >
                                      Edit
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>

        {/* User Details Modal */}
        <UserDetailsModal
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          user={selectedUser}
          onDelete={() => selectedUser && handleDeleteUser(selectedUser.id)}
        />

        {/* User Edit Modal */}
        <UserEditModal
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={selectedUser}
          onUserUpdated={fetchUsers}
        />
      </div>
    </SidebarProvider>
  );
};

export default AdminUsersPage;
