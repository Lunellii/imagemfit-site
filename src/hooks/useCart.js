import { useCallback, useEffect, useState } from "react";
import { commercialClient } from "@/api/commercialClient";

const CART_KEY = "ifq_cart";

const migrateCartText = (value) =>
  String(value || "")
    .replace(/^APA_/i, "AEP_")
    .replace(/^ABR_/i, "E3D_");

const migrateCartItem = (item) => {
  const imageUrl = String(item?.image_url || "")
    .replace("/APA_", "/AEP_")
    .replace("/ABR_", "/E3D_");
  const category = String(item?.category || item?.category_name || "")
    .replace(/^Abstrato Pintura e Aquarela$/i, "Abstrato Estilo Pintura")
    .replace(/^Abstrato Relevo$/i, "Estilo 3D");

  return {
    ...item,
    code: migrateCartText(item?.code),
    title: migrateCartText(item?.title),
    image_url: imageUrl,
    ...(item?.category ? { category } : {}),
    ...(item?.category_name ? { category_name: category } : {})
  };
};

const getCart = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    const migrated = stored.map(migrateCartItem);
    if (JSON.stringify(migrated) !== JSON.stringify(stored)) {
      localStorage.setItem(CART_KEY, JSON.stringify(migrated));
    }
    return migrated;
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
    commercialClient.analytics.track("add_to_selection", {
      product_code: item.code,
      category: item.category || item.category_name || ""
    });
  }, []);

  const removeItem = useCallback((id) => {
    const next = getCart().filter((i) => i.id !== id);
    saveCart(next);
    setCart(next);
  }, []);

  const updateItem = useCallback((id, updates) => {
    const next = getCart().map((item) => (item.id === id ? { ...item, ...updates } : item));
    saveCart(next);
    setCart(next);
  }, []);

  const syncItems = useCallback((items) => {
    const detailsById = new Map((items || []).filter((item) => item?.id).map((item) => [item.id, item]));
    const current = getCart();
    let changed = false;
    const next = current.map((item) => {
      const details = detailsById.get(item.id);
      if (!details) return item;
      const updates = {};
      if (!item.category && details.category) updates.category = details.category;
      if ((!item.title || item.title === item.code) && details.title) updates.title = details.title;
      if (!Object.keys(updates).length) return item;
      changed = true;
      return { ...item, ...updates };
    });
    if (!changed) return;
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

  return { cart, addItem, updateItem, syncItems, removeItem, clearCart, isInCart };
}
