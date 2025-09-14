import { Link, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Package, 
  Calendar, 
  Users, 
  ShoppingBag, 
  BarChart3, 
  Settings,
  ArrowLeft,
  Bell,
  LogOut,
  User
} from "lucide-react";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const adminNavItems = [
    { href: "/admin/orders", label: "Rendelések", icon: ShoppingBag, color: "text-blue-600" },
    { href: "/admin/menu", label: "Étlap kezelés", icon: Package, color: "text-green-600" },
    { href: "/admin/daily-menu", label: "Napi menü", icon: Calendar, color: "text-yellow-600" },
    { href: "/admin/menu-schedule", label: "Ütemezés", icon: Calendar, color: "text-purple-600" },
    { href: "/admin/capacity", label: "Kapacitás", icon: Users, color: "text-orange-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="bg-card border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Vissza a főoldalra
                </Link>
              </Button>
              <div className="h-6 border-l border-border" />
              <h1 className="text-2xl font-bold text-primary">Kiscsibe Admin</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {profile && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{profile.full_name || profile.email}</span>
                  <Badge variant="secondary">{profile.role}</Badge>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Kijelentkezés
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Admin Navigation */}
        <div className="bg-card rounded-lg border shadow-sm p-1 mb-8">
          <nav className="flex space-x-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium transition-all duration-300 ${
                  location.pathname === item.href 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Page Content */}
        <div className="animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;