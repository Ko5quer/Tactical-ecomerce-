import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Banner from "./Banner";
import AuthModal from "./AuthModal";
import { useAuth, useCart } from "./AppContext";

/* Wraps every page: banner on top, login popup always available.
   Home ("/") gets the full hero banner, other pages get the slim header. */
export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { authOpen, openAuth, closeAuth } = useAuth();
  const { count } = useCart();

  return (
    <>
      <Banner
        compact={pathname !== "/"}
        cartCount={count}
        onAccount={openAuth}
        onCart={() => navigate("/cart")}
      />
      <Outlet />
      <AuthModal open={authOpen} onClose={closeAuth} />
    </>
  );
}
