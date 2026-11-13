import { BrowserRouter, Route, Routes } from "react-router-dom";
import { routerBasename } from "./lib/paths.js";
import { SessionProvider } from "./session.jsx";
import { CallbackPage } from "./pages/CallbackPage.jsx";
import { CartPage } from "./pages/CartPage.jsx";
import { CatalogPage } from "./pages/CatalogPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { PendingPage } from "./pages/PendingPage.jsx";
import { ProductPage } from "./pages/ProductPage.jsx";
import { ThankYouPage } from "./pages/ThankYouPage.jsx";

export default function App() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <SessionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/pending" element={<PendingPage />} />
          <Route path="/" element={<CatalogPage />} />
          <Route path="/product/:productId" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}
