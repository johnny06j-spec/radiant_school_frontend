// src/hooks/useFinanceAdmin.js
import { useState, useCallback } from "react";
import API from "../api/axiosInstance";

export const useFinanceAdmin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // State buckets preserved for your dynamic admin views
  const [feeStructures, setFeeStructures] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [payments, setPayments] = useState([]);
  
  // Normalized metrics object matching both dashboard summary and debtors overview views
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalDebtorsCount: 0,
    totalPreviousOutstanding: 0,
    totalCurrentOutstanding: 0,
    totalOutstandingAll: 0,
    classesWithDebtorsCount: 0,
    grossExpectedRevenue: 0,
    totalNetCollected: 0,
    totalSystemArrears: 0
  });

  // Clears both error and success message states
  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  // --- 1. SET / FETCH SYSTEM BLUEPRINT FEES ---
  const fetchFeeStructures = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await API.get("/finance/structures");
      setFeeStructures(response.data?.data || response.data || []);
    } catch (err) {
      setErrorMsg("Failed to stream fee configurations from database.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveFeeStructure = async (feeData) => {
    setIsLoading(true);
    clearMessages();
    try {
      const response = await API.post("/finance/structure", feeData);
      if (response.status === 200 || response.data?.success) {
        setSuccessMsg("🎉 Fee schedule mapped safely to structural database collections!");
        await fetchFeeStructures();
        return true;
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Collection mutation constraint violation.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. LIVE DASHBOARD METRICS AGGREGATION ---
  // 🟢 FIXED: Now accepts filters to dynamically sync metrics cards with selected dropdown values
  const fetchSummaryMetrics = useCallback(async (filters = {}) => {
    setIsLoading(true);
    try {
      const response = await API.get("/finance/dashboard-summary", { params: filters });
      if (response.data?.success) {
        setSummaryMetrics(prev => ({
          ...prev,
          ...response.data.data
        }));
      }
    } catch (err) {
      setErrorMsg("Failed to sync live global dashboard metrics.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- 3. DYNAMIC DEBTORS LIST MONITORING ---
  const fetchDebtorsList = useCallback(async (filters = {}) => {
    setIsLoading(true);
    try {
      const response = await API.get("/finance/debtors", { params: filters });
      
      if (response.data?.success) {
        setDebtors(response.data.debtors || []);
        
        if (response.data.metrics) {
          setSummaryMetrics(prev => ({
            ...prev,
            ...response.data.metrics
          }));
        }
      }
    } catch (err) {
      setErrorMsg("Failed to sync dynamic debtors ledger matrices.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- 4. EXPORT AND DOWNLOAD CHANNELS ---
  const downloadDebtorsPdf = useCallback(async (filters = {}) => {
    setIsLoading(true);
    clearMessages();
    try {
      const response = await API.get("/finance/debtors/export-pdf", { params: filters });
      
      if (response.data?.success) {
        return response.data; // Safely pipelines data straight to your local layout canvas builder
      }
      
      throw new Error("PDF layout compilation channel failed.");
    } catch (err) {
      console.error("PDF gathering pipeline exception:", err);
      setErrorMsg("Failed to gather printable structural matrix parameters.");
      
      // Return a safe fallback object matching your print engine expectations instead of null
      return {
        success: false,
        academicSession: filters.session || "2026/2027",
        academicTerm: filters.term || "First Term",
        grandTotals: { grandTotalPrevious: 0, grandTotalCurrent: 0, grandTotalSchool: 0 },
        reportData: []
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading, 
    errorMsg, 
    successMsg, 
    feeStructures, 
    debtors, 
    payments, 
    summaryMetrics,
    metrics: summaryMetrics, // Alias fallback matching both component variants
    clearMessages, 
    fetchFeeStructures, 
    saveFeeStructure, 
    fetchSummaryMetrics, 
    fetchDebtorsList,
    downloadDebtorsPdf
  };
};