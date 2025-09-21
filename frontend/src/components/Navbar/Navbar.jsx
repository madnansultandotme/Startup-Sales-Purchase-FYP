import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isEntrepreneur, isStudent, isInvestor } = useAuth();

  // Change navbar style on scroll
  // useEffect(() => {
  //   const handleScroll = () => {
  //     setIsScrolled(window.scrollY > 100);
  //   };

  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Role-based navigation links
  const getNavLinks = () => {
    const baseLinks = [
      { path: "/", label: "Home" },
    ];

    if (isAuthenticated) {
      baseLinks.push(
        { path: "/dashboard", label: "Dashboard" },
        { path: "/marketplace", label: "Marketplace" },
        { path: "/collaboration", label: "Collaboration" },
        { path: "/message", label: "Messages" },
        { path: "/account", label: "Account" }
      );

      // Role-specific links
      if (isEntrepreneur()) {
        baseLinks.push(
          { path: "/createstartup", label: "Create Startup" },
          { path: "/pitch-idea", label: "Pitch Idea" }
        );
      }
      
      if (isInvestor()) {
        baseLinks.push({ path: "/investor-dashboard", label: "Investor Panel" });
      }
      
      if (isStudent()) {
        baseLinks.push({ path: "/search", label: "Find Jobs" });
      }
    } else {
      baseLinks.push(
        { path: "/login", label: "Login" },
        { path: "/signup", label: "Signup" }
      );
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}>
      <Link to="/" className={styles.logoContainer}>
        <img src="./logo.svg" alt="Logo" className={styles.logo} />
      </Link>

      <div className={styles.navLinks}>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`${styles.navLink} ${
              location.pathname === link.path ? styles.active : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
        
        {isAuthenticated && (
          <div className={styles.userMenu}>
            <span className={styles.userName}>
              {user?.username} ({user?.role})
            </span>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Logout
            </button>
          </div>
        )}
      </div>

      <button
        className={`${styles.mobileMenuButton} ${
          isMenuOpen ? styles.active : ""
        }`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.active : ""}`}
      >
        <div className={styles.mobileMenuHeader}>
          <Link to="/" onClick={closeMenu}>
            <img src="./logo.svg" alt="Logo" className={styles.logo} />
          </Link>
          <button className={styles.closeButton} onClick={closeMenu}>
            <span></span>
            <span></span>
          </button>
        </div>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`${styles.navLink} ${
              location.pathname === link.path ? styles.active : ""
            }`}
            onClick={closeMenu}
          >
            {link.label}
          </Link>
        ))}
        
        {isAuthenticated && (
          <div className={styles.mobileUserMenu}>
            <div className={styles.mobileUserName}>
              {user?.username} ({user?.role})
            </div>
            <button onClick={() => { handleLogout(); closeMenu(); }} className={styles.mobileLogoutBtn}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export { Navbar };
