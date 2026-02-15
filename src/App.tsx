import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { OrderNotificationsProvider } from "@/contexts/OrderNotificationsContext";
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
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminMenu from "./pages/admin/Menu";
import AdminMenuSchedule from "./pages/admin/MenuSchedule";
import AdminDailyMenu from "./pages/admin/DailyMenu";
import AdminCapacity from "./pages/admin/Capacity";
import AdminGallery from "./pages/admin/Gallery";
import AdminLegalPages from "./pages/admin/LegalPages";
import AdminAboutPage from "./pages/admin/AboutPage";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminCoupons from "./pages/admin/Coupons";
import AdminInvoices from "./pages/admin/Invoices";
import StaffOrders from "./pages/staff/StaffOrders";
import Impresszum from "./pages/legal/Impresszum";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsAndConditions from "./pages/legal/TermsAndConditions";
import CookiePolicy from "./pages/legal/CookiePolicy";
import CookieConsent from "./components/CookieConsent";
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
            <OrderNotificationsProvider>
            <CookieConsent />
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
              
              {/* Legal pages */}
              <Route path="/impresszum" element={<Impresszum />} />
              <Route path="/adatvedelem" element={<PrivacyPolicy />} />
              <Route path="/aszf" element={<TermsAndConditions />} />
              <Route path="/cookie-szabalyzat" element={<CookiePolicy />} />
              
              {/* Staff routes - read-only access */}
              <Route path="/staff/orders" element={
                <ProtectedRoute requireStaff>
                  <StaffOrders />
                </ProtectedRoute>
              } />
              
              {/* Admin routes - full access */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
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
              <Route path="/admin/legal" element={
                <ProtectedRoute requireAdmin>
                  <AdminLegalPages />
                </ProtectedRoute>
              } />
              <Route path="/admin/about" element={
                <ProtectedRoute requireAdmin>
                  <AdminAboutPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedRoute requireAdmin>
                  <AdminAnalytics />
                </ProtectedRoute>
              } />
              <Route path="/admin/coupons" element={
                <ProtectedRoute requireAdmin>
                  <AdminCoupons />
                </ProtectedRoute>
              } />
              <Route path="/admin/invoices" element={
                <ProtectedRoute requireAdmin>
                  <AdminInvoices />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </OrderNotificationsProvider>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </ThemeProvider>
  </QueryClientProvider>
);

export default App;
