import { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

export const LowStockContext = createContext(null);

export function LowStockProvider({ children }) {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = () => {
      if (!localStorage.getItem("token")) {
        setLoading(false);
        return;
      }
      api
        .get("/dashboard/low-stock")
        .then((res) => {
          setLowStockCount(res.data?.low_stock ?? 0);
          setLowStockItems(res.data?.low_stock_items ?? []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    };

    loadAlerts();
    const interval = setInterval(loadAlerts, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <LowStockContext.Provider value={{ lowStockCount, lowStockItems, loading }}>
      {children}
    </LowStockContext.Provider>
  );
}

export function useLowStock() {
  const context = useContext(LowStockContext);
  if (!context) {
    throw new Error("useLowStock must be used within a LowStockProvider");
  }
  return context;
}
