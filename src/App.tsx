import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import AdminOrders from "./pages/admin/Orders";
import AdminMenu from "./pages/admin/Menu";
import AdminMenuSchedule from "./pages/admin/MenuSchedule";
import AdminDailyMenu from "./pages/admin/DailyMenu";
import AdminCapacity from "./pages/admin/Capacity";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
