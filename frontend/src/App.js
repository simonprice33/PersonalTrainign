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

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Client Contact Form Route - No navigation */}
          <Route path="/client-contact-request" element={<ClientContactForm />} />
          
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