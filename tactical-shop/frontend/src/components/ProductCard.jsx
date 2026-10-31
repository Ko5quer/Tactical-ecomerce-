import { useEffect, useRef, useState } from "react";
import { useAuth, useCart } from "./AppContext";
import { errorMessage, formatPrice, mediaUrl } from "./api";
import SafeImage from "./SafeImage";

export default function ProductCard({ product }) {
  const { user, openAuth } = useAuth();
  const { addToCart } = useCart();
  const [state, setState] = useState("idle"); // idle | adding | added
  const [error, setError] = useState("");
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  const img = mediaUrl(product.image);
  const outOfStock = product.current_stock < 1;

  const add = async () => {
    if (!user) return openAuth(); // need an account to have a cart
    setState("adding");
    setError("");
    try {
      await addToCart(product.id, 1);
      setState("added");
      timer.current = setTimeout(() => setState("idle"), 1600);
    } catch (err) {
      setError(errorMessage(err));
      setState("idle");
    }
  };

  return (
    <article className="product">
      <div className="product__media">
        <SafeImage src={img} alt={product.product_name} />
        {outOfStock && <span className="product__tag">Sold out</span>}
        {!outOfStock && product.current_stock <= 5 && (
          <span className="product__tag product__tag--low">Only {product.current_stock} left</span>
        )}
      </div>

      <div className="product__body">
        <h3 className="product__name">{product.product_name}</h3>
        {product.description && <p className="product__desc">{product.description}</p>}

        <div className="product__foot">
          <span className="product__price">{formatPrice(product.product_price)}</span>
          <button
            type="button"
            className={`btn btn--small ${state === "added" ? "btn--done" : ""}`}
            onClick={add}
            disabled={outOfStock || state === "adding"}
          >
            {outOfStock ? "Sold out" : state === "adding" ? "Adding…" : state === "added" ? "Added ✓" : "Add to cart"}
          </button>
        </div>
        {error && <p className="product__error">{error}</p>}
      </div>
    </article>
  );
}
