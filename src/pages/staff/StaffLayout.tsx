import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalOrderNotifications } from "@/hooks/useGlobalOrderNotifications";
import OrderNotificationModal from "@/components/admin/OrderNotificationModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  ShoppingBag, 
  ArrowLeft,
  LogOut,
  User
} from "lucide-react";

const StaffLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { 
    newOrdersCount, 
    clearNewOrdersCount, 
    currentNotification, 
    pendingCount,
    dismissNotification 
  } = useGlobalOrderNotifications();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleOrdersClick = () => {
    clearNewOrdersCount();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Order Notification Modal */}
      <OrderNotificationModal 
        order={currentNotification}
        onDismiss={dismissNotification}
        pendingCount={pendingCount}
        navigateTo="/staff/orders"
      />

      {/* Sticky Staff Header */}
      <header className="sticky top-[constant(safe-area-inset-top)] top-[env(safe-area-inset-top)] z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b">
        <div className="mx-auto max-w-screen-xl px-3 sm:px-4 flex items-center gap-2 sm:gap-4 py-2">
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
              <span className="block text-[14px] sm:text-lg font-bold leading-tight text-primary">Személyzet</span>
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
            <Badge variant="secondary" className="hidden xs:inline-flex text-[11px] px-2 py-0.5">
              Személyzet
            </Badge>

            {/* Logout with confirmation dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-11 min-w-[44px] sm:w-auto sm:px-3"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2 text-sm">Kijelentkezés</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kijelentkezés</AlertDialogTitle>
                  <AlertDialogDescription>
                    Biztosan ki szeretnél jelentkezni? Az új rendelésekről nem fogsz értesítéseket kapni.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Mégsem</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOut}>
                    Igen, kijelentkezés
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Sticky Navigation Tabs - Only Orders for Staff */}
      <nav className="sticky top-[calc(env(safe-area-inset-top,0)+56px)] z-40 bg-card/95 backdrop-blur border-b">
        <div className="overflow-x-auto no-scrollbar">
          <ul className="flex min-w-full items-center px-3 py-2">
            <li>
              <Link
                to="/staff/orders"
                onClick={handleOrdersClick}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200 whitespace-nowrap min-h-[36px] ${
                  location.pathname === "/staff/orders" 
                    ? "bg-primary text-primary-foreground border-b-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Rendelések</span>
                <span className="sm:hidden text-sm">Rendelések</span>
                {newOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {newOrdersCount > 9 ? '9+' : newOrdersCount}
                    </span>
                  </span>
                )}
              </Link>
            </li>
          </ul>
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

export default StaffLayout;
