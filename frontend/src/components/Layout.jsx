import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Banner from "./Banner";
import AuthModal from "./AuthModal";
import SearchOverlay from "./SearchOverlay";
import Footer from "./Footer";
import ErrorBoundary from "./ErrorBoundary";
import { useAuth, useCart } from "./AppContext";

/* Wraps every page: banner on top, footer at the bottom, login + search popups.
   Home ("/") gets the full hero banner, other pages get the slim header. */
export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { authOpen, openAuth, closeAuth } = useAuth();
  const { count } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <Banner
        compact={pathname !== "/"}
        cartCount={count}
        onSearch={() => setSearchOpen(true)}
        onAccount={openAuth}
        onCart={() => navigate("/cart")}
      />

      {/* key = a crash on one page doesn't follow you to the next */}
      <ErrorBoundary key={pathname}>
        <Outlet />
      </ErrorBoundary>

      <Footer />
      <AuthModal open={authOpen} onClose={closeAuth} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
