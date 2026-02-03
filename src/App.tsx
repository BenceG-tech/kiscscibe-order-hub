import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Etlap from "./pages/Etlap";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Gallery from "./pages/Gallery";
import AdminOrders from "./pages/admin/Orders";
import AdminMenu from "./pages/admin/Menu";
import AdminMenuSchedule from "./pages/admin/MenuSchedule";
import AdminDailyMenu from "./pages/admin/DailyMenu";
import AdminCapacity from "./pages/admin/Capacity";
import AdminGallery from "./pages/admin/Gallery";
import StaffOrders from "./pages/staff/StaffOrders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/etlap" element={<Etlap />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/gallery" element={<Gallery />} />
              
              {/* Staff routes - read-only access */}
              <Route path="/staff/orders" element={
                <ProtectedRoute requireStaff>
                  <StaffOrders />
                </ProtectedRoute>
              } />
              
              {/* Admin routes - full access */}
              <Route path="/admin/orders" element={
                <ProtectedRoute requireAdmin>
                  <AdminOrders />
                </ProtectedRoute>
              } />
              <Route path="/admin/menu" element={
                <ProtectedRoute requireAdmin>
                  <AdminMenu />
                </ProtectedRoute>
              } />
              <Route path="/admin/daily-menu" element={
                <ProtectedRoute requireAdmin>
                  <AdminDailyMenu />
                </ProtectedRoute>
              } />
              <Route path="/admin/menu-schedule" element={
                <ProtectedRoute requireAdmin>
                  <AdminMenuSchedule />
                </ProtectedRoute>
              } />
              <Route path="/admin/capacity" element={
                <ProtectedRoute requireAdmin>
                  <AdminCapacity />
                </ProtectedRoute>
              } />
              <Route path="/admin/gallery" element={
                <ProtectedRoute requireAdmin>
                  <AdminGallery />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </ThemeProvider>
  </QueryClientProvider>
);

export default App;
