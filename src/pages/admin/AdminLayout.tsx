import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useOrderNotifications } from "@/contexts/OrderNotificationsContext";
import { 
  Package, 
  Calendar, 
  ShoppingBag, 
  ArrowLeft,
  LogOut,
  User,
  Image,
  FileText,
  Info,
  LayoutDashboard,
  BarChart3,
  Tag
} from "lucide-react";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { newOrdersCount, clearNewOrdersCount } = useOrderNotifications();

  const handleSignOut = async () => {
    await signOut();
  };

  // Clear badge when navigating to orders
  const handleOrdersClick = () => {
    clearNewOrdersCount();
  };

  const adminNavItems = [
    { href: "/admin", label: "Irányítópult", mobileLabel: "Kezdő", icon: LayoutDashboard, showBadge: false },
    { href: "/admin/orders", label: "Rendelések", mobileLabel: "Rendelés", icon: ShoppingBag, showBadge: true },
    { href: "/admin/menu", label: "Étlap kezelés", mobileLabel: "Étlap", icon: Package, showBadge: false },
    { href: "/admin/daily-menu", label: "Napi ajánlat", mobileLabel: "Napi", icon: Calendar, showBadge: false },
    { href: "/admin/gallery", label: "Galéria", mobileLabel: "Galéria", icon: Image, showBadge: false },
    { href: "/admin/legal", label: "Jogi oldalak", mobileLabel: "Jogi", icon: FileText, showBadge: false },
    { href: "/admin/about", label: "Rólunk", mobileLabel: "Rólunk", icon: Info, showBadge: false },
    { href: "/admin/analytics", label: "Statisztika", mobileLabel: "Stat.", icon: BarChart3, showBadge: false },
    { href: "/admin/coupons", label: "Kuponok", mobileLabel: "Kupon", icon: Tag, showBadge: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Admin Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b h-14">
        <div className="mx-auto max-w-screen-xl px-3 sm:px-4 flex items-center gap-2 sm:gap-4 h-full">
          {/* Left: Logo + Brand */}
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Vissza a főoldalra
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="sm:hidden p-1">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="hidden sm:block h-6 border-l border-border" />
            <div className="truncate">
              <span className="block text-[18px] sm:text-2xl font-bold leading-tight text-primary">Kiscsibe</span>
              <span className="block text-[14px] sm:text-lg font-bold leading-tight text-primary">Admin</span>
            </div>
          </div>

          {/* Right: User + Actions */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {profile && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium truncate max-w-[120px]">{profile.full_name || profile.email}</span>
              </div>
            )}
            {profile?.role && (
              <Badge variant="secondary" className="hidden xs:inline-flex text-[11px] px-2 py-0.5">
                {profile.role}
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="h-9 w-9 sm:w-auto sm:px-3"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2 text-sm">Kijelentkezés</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Sticky Navigation Tabs */}
      <nav className="sticky top-14 z-40 bg-card/95 backdrop-blur border-b">
        {/* Desktop: horizontal scroll */}
        <div className="hidden md:block overflow-x-auto no-scrollbar">
          <ul className="flex min-w-full items-center px-3 py-2">
            {adminNavItems.map((item, index) => (
              <li key={item.href} className={index < adminNavItems.length - 1 ? "mr-6" : ""}>
                <Link
                  to={item.href}
                  onClick={item.showBadge ? handleOrdersClick : undefined}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200 whitespace-nowrap min-h-[36px] border-b-2 ${
                    location.pathname === item.href 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.showBadge && newOrdersCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                      <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {newOrdersCount > 9 ? '9+' : newOrdersCount}
                      </span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Mobile: 3-column grid */}
        <div className="md:hidden px-2 py-2">
          <div className="grid grid-cols-3 gap-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={item.showBadge ? handleOrdersClick : undefined}
                className={`relative flex flex-col items-center gap-0.5 px-1 py-2 rounded-md font-medium transition-all duration-200 text-center border-b-2 ${
                  location.pathname === item.href 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-[11px] leading-tight">{item.mobileLabel}</span>
                {item.showBadge && newOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {newOrdersCount > 9 ? '9+' : newOrdersCount}
                    </span>
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="mx-auto max-w-screen-xl px-3 sm:px-4">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
