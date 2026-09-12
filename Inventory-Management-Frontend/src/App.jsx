import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import { AuthProvider } from "./contexts/AuthContext";
import Suppliers from "./pages/Suppliers";
import ProductList from "./pages/Products/ProductsList";
import Categories from "./pages/Categories";
import Purchases from "./pages/Pruchases/Purchases";
import Sales from "./pages/Sales/Sales";
import StockHistory from "./pages/StockHistory";
import User from "./pages/User";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Departments from "./pages/Department";
import Roles from "./pages/Roles";
import Customers from "./pages/Customers";
import AuditLog from "./pages/Auditlog";
import ProductView from "./pages/Products/ProductDetail";
import AnalyticsPage from "./pages/AnalyticsPage";
import Commissions from "./pages/Commissions";
import Salespurchaseanalytics from "./pages/Salespurchaseanalytics";
import ConfirmEmailChange from "./pages/Security/ConfirmEmailChange";
import NotFound from "./pages/NotFound";
import { LowStockProvider } from "./contexts/LowStockContext";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import { AlertProvider } from "./components/Alertsystem";
import { ToastProvider } from "./components/Toastsystem"; 

function App() {
  return (
    <ToastProvider>
      <AlertProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/email/confirm/:token"
                element={<ConfirmEmailChange />}
              />

              <Route
                element={
                  <ProtectedRoute>
                    <LowStockProvider>
                      <DashboardLayout />
                    </LowStockProvider>
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/stock-history" element={<StockHistory />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/users" element={<User />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/roles" element={<Roles />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/audit-log" element={<AuditLog />} />
                <Route path="/recommendations" element={<AnalyticsPage />} />
                <Route
                  path="/analytics/buy-vs-sale"
                  element={<Salespurchaseanalytics />}
                />
                <Route path="/commissions" element={<Commissions />} />
                <Route path="/products/:id/view" element={<ProductView />} />
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AlertProvider>
    </ToastProvider>
  );
}

export default App;
