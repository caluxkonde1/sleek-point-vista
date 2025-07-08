export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  outlet_id: string | null;
  created_at: string;
  outlets?: {
    name: string;
  } | null;
}

export interface Outlet {
  id: string;
  name: string;
}

export interface UserFormData {
  full_name: string;
  phone: string;
  role: 'staff' | 'cashier' | 'manager' | 'admin';
  outlet_id: string;
  is_active: boolean;
}