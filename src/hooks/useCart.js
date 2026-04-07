import { useCallback, useEffect, useState } from "react";

const CART_KEY = "ifq_cart";

const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch (_err) {
    return [];
  }
};

const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
};

export function useCart() {
  const [cart, setCart] = useState(getCart);

  useEffect(() => {
    const handler = () => setCart(getCart());
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  const addItem = useCallback((item) => {
    const current = getCart();
    if (current.find((i) => i.id === item.id)) return;
    const next = [...current, item];
    saveCart(next);
    setCart(next);
  }, []);

  const removeItem = useCallback((id) => {
    const next = getCart().filter((i) => i.id !== id);
    saveCart(next);
    setCart(next);
  }, []);

  const clearCart = useCallback(() => {
    saveCart([]);
    setCart([]);
  }, []);

  const isInCart = useCallback((id) => {
    return getCart().some((i) => i.id === id);
  }, []);

  return { cart, addItem, removeItem, clearCart, isInCart };
}
