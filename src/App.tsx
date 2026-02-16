import React, { Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { OrderNotificationsProvider } from "@/contexts/OrderNotificationsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/ui/loading";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Etlap from "./pages/Etlap";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Gallery from "./pages/Gallery";
import Impresszum from "./pages/legal/Impresszum";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsAndConditions from "./pages/legal/TermsAndConditions";
import CookiePolicy from "./pages/legal/CookiePolicy";
import CookieConsent from "./components/CookieConsent";
import NotFound from "./pages/NotFound";
import Rate from "./pages/Rate";

// Lazy-loaded admin & staff pages
const AdminDashboard = React.lazy(() => import("./pages/admin/Dashboard"));
const AdminOrders = React.lazy(() => import("./pages/admin/Orders"));
const AdminMenu = React.lazy(() => import("./pages/admin/Menu"));
const AdminMenuSchedule = React.lazy(() => import("./pages/admin/MenuSchedule"));
const AdminDailyMenu = React.lazy(() => import("./pages/admin/DailyMenu"));
const AdminCapacity = React.lazy(() => import("./pages/admin/Capacity"));
const AdminGallery = React.lazy(() => import("./pages/admin/Gallery"));
const AdminLegalPages = React.lazy(() => import("./pages/admin/LegalPages"));
const AdminAboutPage = React.lazy(() => import("./pages/admin/AboutPage"));
const AdminAnalytics = React.lazy(() => import("./pages/admin/Analytics"));
const AdminCoupons = React.lazy(() => import("./pages/admin/Coupons"));
const AdminInvoices = React.lazy(() => import("./pages/admin/Invoices"));
const StaffOrders = React.lazy(() => import("./pages/staff/StaffOrders"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner className="h-8 w-8" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Sonner />
            <BrowserRouter>
            <ErrorBoundary>
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
              <Route path="/rate" element={<Rate />} />
              <Route path="/gallery" element={<Gallery />} />
              
              {/* Legal pages */}
              <Route path="/impresszum" element={<Impresszum />} />
              <Route path="/adatvedelem" element={<PrivacyPolicy />} />
              <Route path="/aszf" element={<TermsAndConditions />} />
              <Route path="/cookie-szabalyzat" element={<CookiePolicy />} />
              
              {/* Staff routes */}
              <Route path="/staff/orders" element={
                <ProtectedRoute requireStaff>
                  <Suspense fallback={<LazyFallback />}><StaffOrders /></Suspense>
                </ProtectedRoute>
              } />
              
              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LazyFallback />}><AdminDashboard /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LazyFallback />}><AdminOrders /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/menu" element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LazyFallback />}><AdminMenu /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/daily-menu" element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LazyFallback />}><AdminDailyMenu /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/menu-schedule" element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LazyFallback />}><AdminMenuSchedule /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/capacity" element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LazyFallback />}><AdminCapacity /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/gallery" element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LazyFallback />}><AdminGallery /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/legal" element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LazyFallback />}><AdminLegalPages /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/about" element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LazyFallback />}><AdminAboutPage /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LazyFallback />}><AdminAnalytics /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/coupons" element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LazyFallback />}><AdminCoupons /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/admin/invoices" element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LazyFallback />}><AdminInvoices /></Suspense>
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </OrderNotificationsProvider>
          </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </ThemeProvider>
  </QueryClientProvider>
);

export default App;
