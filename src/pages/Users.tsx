import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { UserX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from '@/hooks/useUsers';
import { useOutlets } from '@/hooks/useOutlets';
import { UserSearchBar } from '@/components/users/UserSearchBar';
import { UserCard } from '@/components/users/UserCard';

const Users = () => {
  const { profile } = useAuth();
  const { users, loading, updateUser, toggleUserStatus } = useUsers();
  const { outlets } = useOutlets();
  const [searchQuery, setSearchQuery] = useState('');

  // Check if current user can manage other users
  const canManageUsers = profile?.role === 'superadmin' || profile?.role === 'admin';
  const canEditRole = profile?.role === 'superadmin';

  if (!canManageUsers) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-8">
            <UserX className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to manage users.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>

      <UserSearchBar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => (
          <UserCard
            key={user.id}
            user={user}
            outlets={outlets}
            onUpdate={updateUser}
            onToggleStatus={toggleUserStatus}
            loading={loading}
            canEditRole={canEditRole}
          />
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No users found</p>
        </div>
      )}
    </div>
  );
};

export default Users;