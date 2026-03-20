"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface CustomerInfo {
  id: string;
  companyName: string;
  domain: string | null;
  logoUrl: string | null;
}

interface CustomerContextType {
  customers: CustomerInfo[];
  activeCustomer: CustomerInfo | null;
  setActiveCustomer: (customer: CustomerInfo) => void;
  refreshCustomers: () => Promise<void>;
  loading: boolean;
}

const CustomerContext = createContext<CustomerContextType>({
  customers: [],
  activeCustomer: null,
  setActiveCustomer: () => {},
  refreshCustomers: async () => {},
  loading: true,
});

export function useCustomer() {
  return useContext(CustomerContext);
}

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [activeCustomer, setActiveCustomerState] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshCustomers() {
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        const list = (data.data || data || []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          companyName: c.companyName as string,
          domain: c.domain as string | null,
          logoUrl: c.logoUrl as string | null,
        }));
        setCustomers(list);

        // Restore active customer from localStorage
        const storedId = localStorage.getItem("seopilot-active-customer");
        const found = list.find((c: CustomerInfo) => c.id === storedId);
        if (found) {
          setActiveCustomerState(found);
        } else if (list.length > 0) {
          setActiveCustomerState(list[0]);
          localStorage.setItem("seopilot-active-customer", list[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setActiveCustomer(customer: CustomerInfo) {
    setActiveCustomerState(customer);
    localStorage.setItem("seopilot-active-customer", customer.id);
  }

  return (
    <CustomerContext.Provider
      value={{ customers, activeCustomer, setActiveCustomer, refreshCustomers, loading }}
    >
      {children}
    </CustomerContext.Provider>
  );
}
