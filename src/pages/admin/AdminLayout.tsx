import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useOrderNotifications } from "@/contexts/OrderNotificationsContext";
import { useOverdueInvoices } from "@/hooks/useOverdueInvoices";
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
  Tag,
  Receipt,
  Users,
  HelpCircle,
  FolderOpen,
  MoreHorizontal,
  ChevronDown
} from "lucide-react";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { newOrdersCount, clearNewOrdersCount } = useOrderNotifications();
  const { data: finData } = useOverdueInvoices();
  const overdueCount = finData?.overdueCount || 0;

  const handleSignOut = async () => {
    await signOut();
  };

  const handleOrdersClick = () => {
    clearNewOrdersCount();
  };

  // PRIMARY items — daily/operational work, always visible on desktop
  const primaryNavItems = [
    { href: "/admin", label: "Irányítópult", mobileLabel: "Kezdő", icon: LayoutDashboard, badgeCount: 0 },
    { href: "/admin/orders", label: "Rendelések", mobileLabel: "Rendelés", icon: ShoppingBag, badgeCount: newOrdersCount, onClickOverride: handleOrdersClick },
    { href: "/admin/daily-menu", label: "Napi ajánlat", mobileLabel: "Napi", icon: Calendar, badgeCount: 0 },
    { href: "/admin/menu", label: "Étlap", mobileLabel: "Étlap", icon: Package, badgeCount: 0 },
    { href: "/admin/invoices", label: "Számlák", mobileLabel: "Számla", icon: Receipt, badgeCount: overdueCount },
    { href: "/admin/documents", label: "Dokumentumok", mobileLabel: "Doksi", icon: FolderOpen, badgeCount: 0 },
    { href: "/admin/analytics", label: "Statisztika", mobileLabel: "Stat.", icon: BarChart3, badgeCount: 0 },
  ];

  // SECONDARY items — less frequently used, behind "Több" on desktop, inline on mobile
  const secondaryNavItems: typeof primaryNavItems = [
    { href: "/admin/coupons", label: "Kuponok", mobileLabel: "Kupon", icon: Tag, badgeCount: 0 },
    { href: "/admin/partners", label: "Partnerek", mobileLabel: "Partner", icon: Users, badgeCount: 0 },
    { href: "/admin/gallery", label: "Galéria", mobileLabel: "Galéria", icon: Image, badgeCount: 0 },
    { href: "/admin/about", label: "Rólunk oldal", mobileLabel: "Rólunk", icon: Info, badgeCount: 0 },
    { href: "/admin/faq", label: "GYIK", mobileLabel: "GYIK", icon: HelpCircle, badgeCount: 0 },
    { href: "/admin/legal", label: "Jogi oldalak", mobileLabel: "Jogi", icon: FileText, badgeCount: 0 },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const isSecondaryActive = secondaryNavItems.some((it) => location.pathname === it.href);
  const secondaryBadgeTotal = secondaryNavItems.reduce((s, it) => s + (it.badgeCount || 0), 0);

  const renderBadge = (count: number, size: "sm" | "lg") => {
    if (count <= 0) return null;
    const dim = size === "lg" ? "h-5 w-5" : "h-4 w-4";
    const text = size === "lg" ? "text-[10px]" : "text-[9px]";
    return (
      <span className={`absolute -top-1 -right-1 flex ${dim} items-center justify-center`}>
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75`}></span>
        <span className={`relative inline-flex ${dim} items-center justify-center rounded-full bg-destructive ${text} font-bold text-destructive-foreground`}>
          {count > 9 ? '9+' : count}
        </span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Admin Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b h-14">
        <div className="mx-auto max-w-screen-xl px-3 sm:px-4 flex items-center gap-2 sm:gap-4 h-full">
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
        {/* DESKTOP: primary items + "Több" dropdown */}
        <div className="hidden md:block">
          <ul className="flex items-center gap-1 px-3 py-2 max-w-screen-xl mx-auto">
            {primaryNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={item.onClickOverride}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200 whitespace-nowrap min-h-[36px] text-sm ${
                    location.pathname === item.href 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {renderBadge(item.badgeCount, "lg")}
                </Link>
              </li>
            ))}

            {/* "Több" dropdown for secondary items */}
            <li className="ml-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200 whitespace-nowrap min-h-[36px] text-sm ${
                      isSecondaryActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span>Több</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                    {renderBadge(secondaryBadgeTotal, "lg")}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-popover">
                  {secondaryNavItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        to={item.href}
                        className={`flex items-center gap-2 cursor-pointer ${
                          location.pathname === item.href ? "bg-accent text-accent-foreground" : ""
                        }`}
                      >
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{item.label}</span>
                        {item.badgeCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 text-[10px] px-1.5">
                            {item.badgeCount > 9 ? '9+' : item.badgeCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          </ul>
        </div>

        {/* MOBILE: horizontal scroll, all items, primary first */}
        <div className="md:hidden overflow-x-auto no-scrollbar">
          <ul className="flex items-center gap-1 px-2 py-1.5 min-w-max">
            {allNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={item.onClickOverride}
                  className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-all duration-200 whitespace-nowrap text-xs ${
                    location.pathname === item.href 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.mobileLabel}</span>
                  {renderBadge(item.badgeCount, "sm")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Page Content */}
      <main className="mx-auto max-w-screen-xl px-3 sm:px-4">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Floating help button — available on every admin page */}
      <HelpFloatingButton />
    </div>
  );
};

export default AdminLayout;
