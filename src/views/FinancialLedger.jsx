

// src/views/FinancialLedger.jsx
import React from 'react';
import { CreditCard, Wallet, ArrowDownRight } from 'lucide-react';

const FinancialLedger = ({ financialData, styles }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={styles.sectionHeaderTitle}>COMPLETE FEE STATEMENT LEDGER</h3>
      {/* Ledger lists & data components go here */}
    </div>
  );
};

// Ensure there is exactly ONE default export at the bottom of the file
export default FinancialLedger;