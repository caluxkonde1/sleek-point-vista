import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserX } from "lucide-react";
import { Profile, Outlet } from '@/types/user';
import { UserEditDialog } from './UserEditDialog';

interface UserCardProps {
  user: Profile;
  outlets: Outlet[];
  onUpdate: (userId: string, formData: any) => Promise<boolean>;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
  loading: boolean;
  canEditRole?: boolean;
}

export const UserCard = ({ user, outlets, onUpdate, onToggleStatus, loading, canEditRole = false }: UserCardProps) => {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {user.full_name || 'Unnamed User'}
          </CardTitle>
          <Badge variant={getRoleBadgeVariant(user.role)}>
            {user.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {user.phone && (
          <p className="text-sm text-muted-foreground">
            Phone: {user.phone}
          </p>
        )}
        
        {user.outlets && (
          <p className="text-sm text-muted-foreground">
            Outlet: {user.outlets.name}
          </p>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm">Status:</span>
          <Badge variant={user.is_active ? "default" : "secondary"}>
            {user.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="flex gap-2 pt-2">
          <UserEditDialog
            user={user}
            outlets={outlets}
            onUpdate={onUpdate}
            loading={loading}
            canEditRole={canEditRole}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(user.id, user.is_active)}
            className={user.is_active ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-600"}
          >
            {user.is_active ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};