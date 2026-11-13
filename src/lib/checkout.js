import { currentCart } from "@wix/ecom";
import { STORES_APP_ID } from "./config.js";
import { appUrl } from "./paths.js";

function checkoutIdFrom(created) {
  if (!created) return "";
  if (typeof created === "string") return created;
  return created.checkoutId || created.checkout?._id || created._id || "";
}

function redirectUrlFrom(session) {
  return (
    session?.redirectSession?.fullUrl ||
    session?.redirectSession?.fullURL ||
    session?.fullUrl ||
    session?.fullURL ||
    ""
  );
}

export async function addCatalogItem(wix, item, variant, quantity) {
  const catalogReference = {
    appId: STORES_APP_ID,
    catalogItemId: item.id,
  };
  if (variant?.id) {
    catalogReference.options = { variantId: variant.id };
  }
  return wix.currentCart.addToCurrentCart({
    lineItems: [{ catalogReference, quantity }],
  });
}

export async function updateLineQuantity(wix, lineId, quantity) {
  return wix.currentCart.updateCurrentCartLineItemQuantity([
    { _id: lineId, quantity },
  ]);
}

export async function removeLine(wix, lineId) {
  return wix.currentCart.removeLineItemsFromCurrentCart([lineId]);
}

export async function readCurrentCart(wix) {
  try {
    return await wix.currentCart.getCurrentCart();
  } catch {
    return { lineItems: [] };
  }
}

export async function redirectToHostedCheckout(wix) {
  const created = await wix.currentCart.createCheckoutFromCurrentCart({
    channelType: currentCart.ChannelType.WEB,
  });
  const checkoutId = checkoutIdFrom(created);
  if (!checkoutId) {
    throw new Error("Checkout did not start.");
  }
  const session = await wix.redirects.createRedirectSession({
    ecomCheckout: { checkoutId },
    callbacks: {
      postFlowUrl: appUrl("thank-you"),
      thankYouPageUrl: appUrl("thank-you"),
      cartPageUrl: appUrl("cart"),
    },
  });
  const fullUrl = redirectUrlFrom(session);
  if (!fullUrl) {
    throw new Error("Checkout did not start.");
  }
  window.location.assign(fullUrl);
}
