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

// Admin Components
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import EmailManagement from "./components/admin/EmailManagement";
import UserManagement from "./components/admin/UserManagement";
import ChangePassword from "./components/admin/ChangePassword";
import ForgotPassword from "./components/admin/ForgotPassword";
import ResetPassword from "./components/admin/ResetPassword";
import ClientManagement from "./components/admin/ClientManagement";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Client Contact Form Route - No navigation */}
          <Route path="/client-contact-request" element={<ClientContactForm />} />
          
          {/* Unsubscribe Route - No navigation */}
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/reset-password" element={<ResetPassword />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/emails" element={<EmailManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/clients" element={<ClientManagement />} />
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