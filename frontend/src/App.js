import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Services from "./components/Services";
import About from "./components/About";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import ClientContactForm from "./components/ClientContactForm";
import Unsubscribe from "./components/Unsubscribe";
import ClientOnboarding from "./components/ClientOnboarding";

// Admin Components
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import EmailManagement from "./components/admin/EmailManagement";
import UserManagement from "./components/admin/UserManagement";
import ChangePassword from "./components/admin/ChangePassword";
import ForgotPassword from "./components/admin/ForgotPassword";
import ResetPassword from "./components/admin/ResetPassword";
import ClientManagement from "./components/admin/ClientManagement";
import ClientUserManagement from "./components/admin/ClientUserManagement";
import ImportCustomers from "./components/admin/ImportCustomers";
import ContentManagement from "./components/admin/ContentManagement";

// Client Portal Components
import ClientLogin from "./components/client/ClientLogin";
import ClientForgotPassword from "./components/client/ClientForgotPassword";
import ClientCreatePassword from "./components/client/ClientCreatePassword";
import ClientResetPassword from "./components/client/ClientResetPassword";
import ClientPortal from "./components/client/ClientPortal";
import JoinNow from "./pages/JoinNow";
import PurchaseFlow from "./pages/PurchaseFlow";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Client Contact Form Route - No navigation */}
          <Route path="/client-contact-request" element={<ClientContactForm />} />
          
          {/* Unsubscribe Route - No navigation */}
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          
          {/* Client Onboarding Route - No navigation */}
          <Route path="/client-onboarding" element={<ClientOnboarding />} />
          
          {/* Client Portal Routes */}
          <Route path="/client-login" element={<ClientLogin />} />
          <Route path="/client-forgot-password" element={<ClientForgotPassword />} />
          <Route path="/client-create-password/:token" element={<ClientCreatePassword />} />
          <Route path="/client-reset-password/:token" element={<ClientResetPassword />} />
          <Route path="/client-portal" element={<ClientPortal />} />
          
          {/* Landing Page */}
          <Route path="/join-now" element={<JoinNow />} />
          
          {/* Purchase Flow */}
          <Route path="/purchase" element={<PurchaseFlow />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/reset-password" element={<ResetPassword />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/emails" element={<EmailManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/clients" element={<ClientManagement />} />
          <Route path="/admin/client-users" element={<ClientUserManagement />} />
          <Route path="/admin/import-customers" element={<ImportCustomers />} />
          <Route path="/admin/change-password" element={<ChangePassword />} />
          
          {/* Main Website Route */}
          <Route path="/" element={
            <>
              <Header />
              <main>
                <Hero />
                <Services />
                <About />
                <Contact />
              </main>
              <Footer />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;