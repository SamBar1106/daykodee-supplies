import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEMO_CART_KEY } from "./lib/config.js";
import { imageUrl } from "./lib/media.js";
import { toAmount } from "./lib/money.js";
import { optionSummary, unitPrice } from "./lib/catalog.js";
import { isDemoMode } from "./lib/demo.js";
import { DEMO_MEMBER, demoCatalogItems, emptyDemoCart } from "./lib/demoCatalog.js";
import { fetchFranchiseCatalog } from "./lib/franchise.js";
import {
  addCatalogItem,
  readCurrentCart,
  redirectToHostedCheckout,
  removeLine,
  updateLineQuantity,
} from "./lib/checkout.js";
import { appUrl } from "./lib/paths.js";
import {
  clearStoredTokens,
  getWixClient,
  loadCurrentMember,
  memberAccessToken,
  wixConfigured,
} from "./lib/wixClient.js";

const SessionContext = createContext(null);

function readDemoQuantities() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(DEMO_CART_KEY) || "null");
    if (Array.isArray(saved)) return saved;
  } catch {
    // Fall through to the sample order from the cart mockup.
  }
  return emptyDemoCart();
}

function writeDemoQuantities(lines) {
  sessionStorage.setItem(DEMO_CART_KEY, JSON.stringify(lines));
}

function demoCartLines(items, quantities) {
  return quantities
    .map((entry) => {
      const item = items.find((candidate) => candidate.id === entry.productId);
      if (!item) return null;
      const variant = item.variants?.[0] || null;
      return {
        id: entry.productId,
        productId: entry.productId,
        name: item.name || "Franchise item",
        sku: variant?.sku || "",
        optionLabel: optionSummary(variant),
        quantity: entry.quantity,
        unitPrice: toAmount(unitPrice(item, variant)) || 0,
        currency: item.currency || "USD",
        image: imageUrl(item.mainImage),
        note: "Franchise tier guaranteed stock",
      };
    })
    .filter(Boolean);
}

function liveCartLines(cart, items) {
  const source = Array.isArray(cart?.lineItems) ? cart.lineItems : [];
  return source.map((line) => {
    const productId = line?.catalogReference?.catalogItemId || "";
    const item = items.find((candidate) => candidate.id === productId);
    const quantity = Number(line?.quantity || line?.quantityInfo?.confirmedQuantity || 1);
    const descriptions = Array.isArray(line?.descriptionLines) ? line.descriptionLines : [];
    const optionLabel = descriptions
      .map((entry) => entry?.plainText?.original || entry?.plainText?.translated || "")
      .filter(Boolean)
      .join(" · ");
    return {
      id: line?._id || line?.id || productId,
      productId,
      name:
        line?.productName?.translated ||
        line?.productName?.original ||
        item?.name ||
        "Franchise item",
      sku: item?.variants?.find((variant) => variant?.sku)?.sku || "",
      optionLabel: optionLabel || optionSummary(item?.variants?.[0]),
      quantity,
      unitPrice: toAmount(line?.price?.amount ?? line?.price?.convertedAmount) || 0,
      currency: cart?.currency || item?.currency || "USD",
      image: imageUrl(line?.image) || imageUrl(line?.media) || imageUrl(item?.mainImage),
      note:
        line?.availability?.status === "NOT_AVAILABLE"
          ? "Check availability at checkout"
          : "Franchise tier guaranteed stock",
    };
  });
}

export function SessionProvider({ children }) {
  const navigate = useNavigate();
  const demo = useMemo(() => isDemoMode(), []);
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [member, setMember] = useState(null);
  const [catalogStatus, setCatalogStatus] = useState("loading");
  const [catalogReason, setCatalogReason] = useState("");
  const [items, setItems] = useState([]);
  const [cartLines, setCartLines] = useState([]);
  const [cartError, setCartError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadLive = useCallback(async () => {
    const wix = getWixClient();
    if (!wix) {
      setSignedIn(false);
      setCatalogStatus("unconfigured");
      setAuthReady(true);
      return;
    }
    const loggedIn = wix.auth.loggedIn();
    setSignedIn(loggedIn);
    if (!loggedIn) {
      setCatalogStatus("unauthorized");
      setAuthReady(true);
      return;
    }
    try {
      const current = await loadCurrentMember(wix);
      setMember(current);
    } catch {
      setMember(null);
    }
    let token = null;
    try {
      token = await memberAccessToken(wix);
    } catch {
      token = null;
    }
    if (!token) {
      setCatalogStatus("unauthorized");
      setAuthReady(true);
      return;
    }
    const catalog = await fetchFranchiseCatalog(token);
    setCatalogStatus(catalog.status);
    setCatalogReason(catalog.reason || "");
    setItems(catalog.status === "ok" ? catalog.items : []);
    if (catalog.status === "ok") {
      const cart = await readCurrentCart(wix);
      setCartLines(liveCartLines(cart, catalog.items));
    }
    setAuthReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (demo) {
        const catalog = demoCatalogItems();
        if (cancelled) return;
        setMember(DEMO_MEMBER);
        setSignedIn(true);
        setItems(catalog);
        setCartLines(demoCartLines(catalog, readDemoQuantities()));
        setCatalogStatus("ok");
        setAuthReady(true);
        return;
      }
      await loadLive();
    }
    start();
    return () => {
      cancelled = true;
    };
  }, [demo, loadLive]);

  const refreshCart = useCallback(async () => {
    if (demo) {
      setCartLines(demoCartLines(items, readDemoQuantities()));
      return;
    }
    const wix = getWixClient();
    if (!wix) return;
    const cart = await readCurrentCart(wix);
    setCartLines(liveCartLines(cart, items));
  }, [demo, items]);

  const addToCart = useCallback(
    async (item, variant, quantity) => {
      setCartError("");
      setBusy(true);
      try {
        if (demo) {
          const current = readDemoQuantities();
          const existing = current.find((entry) => entry.productId === item.id);
          const next = existing
            ? current.map((entry) =>
                entry.productId === item.id
                  ? { ...entry, quantity: entry.quantity + quantity }
                  : entry,
              )
            : [...current, { productId: item.id, quantity }];
          writeDemoQuantities(next);
          setCartLines(demoCartLines(items, next));
          return;
        }
        const wix = getWixClient();
        if (!wix) throw new Error("missing-client");
        await addCatalogItem(wix, item, variant, quantity);
        await refreshCart();
      } catch {
        setCartError("This item could not be added to the cart. Try again in a moment.");
        throw new Error("add-failed");
      } finally {
        setBusy(false);
      }
    },
    [demo, items, refreshCart],
  );

  const changeQuantity = useCallback(
    async (lineId, quantity) => {
      setCartError("");
      const nextQuantity = Math.max(1, quantity);
      if (demo) {
        const next = readDemoQuantities().map((entry) =>
          entry.productId === lineId ? { ...entry, quantity: nextQuantity } : entry,
        );
        writeDemoQuantities(next);
        setCartLines(demoCartLines(items, next));
        return;
      }
      setBusy(true);
      try {
        const wix = getWixClient();
        await updateLineQuantity(wix, lineId, nextQuantity);
        await refreshCart();
      } catch {
        setCartError("The quantity could not be updated.");
      } finally {
        setBusy(false);
      }
    },
    [demo, items, refreshCart],
  );

  const removeFromCart = useCallback(
    async (lineId) => {
      setCartError("");
      if (demo) {
        const next = readDemoQuantities().filter((entry) => entry.productId !== lineId);
        writeDemoQuantities(next);
        setCartLines(demoCartLines(items, next));
        return;
      }
      setBusy(true);
      try {
        const wix = getWixClient();
        await removeLine(wix, lineId);
        await refreshCart();
      } catch {
        setCartError("That item could not be removed.");
      } finally {
        setBusy(false);
      }
    },
    [demo, items, refreshCart],
  );

  const checkout = useCallback(async () => {
    setCartError("");
    if (demo) {
      navigate("/thank-you?demo=1");
      return;
    }
    setBusy(true);
    try {
      const wix = getWixClient();
      await redirectToHostedCheckout(wix);
    } catch {
      setCartError("Checkout could not be opened. Your cart is still here.");
      setBusy(false);
    }
  }, [demo, navigate]);

  const signOut = useCallback(async () => {
    if (demo) {
      navigate("/login");
      return;
    }
    const wix = getWixClient();
    clearStoredTokens();
    setSignedIn(false);
    setMember(null);
    setItems([]);
    setCartLines([]);
    setCatalogStatus("unauthorized");
    try {
      if (wix) {
        const { logoutUrl } = await wix.auth.logout(appUrl("login"));
        if (logoutUrl) {
          window.location.assign(logoutUrl);
          return;
        }
      }
    } catch {
      // The local member session is already cleared.
    }
    navigate("/login");
  }, [demo, navigate]);

  const value = useMemo(
    () => ({
      demo,
      configured: wixConfigured(),
      authReady,
      signedIn,
      member: demo ? DEMO_MEMBER : member,
      catalogStatus,
      catalogReason,
      items,
      cartLines,
      cartCount: cartLines.length,
      cartError,
      busy,
      addToCart,
      changeQuantity,
      removeFromCart,
      checkout,
      signOut,
    }),
    [
      demo,
      authReady,
      signedIn,
      member,
      catalogStatus,
      catalogReason,
      items,
      cartLines,
      cartError,
      busy,
      addToCart,
      changeQuantity,
      removeFromCart,
      checkout,
      signOut,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
