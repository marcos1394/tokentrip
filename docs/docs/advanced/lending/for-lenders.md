---
title: Guide for Lenders
---

# Lending: Guide for Lenders

Put your SUI or TKT to work by funding collateralized loans and earning a yield.

### 1. Finding Loan Requests

Navigate to the **"/lending"** page to browse all open `LoanRequests`. Each card displays the NFT being offered as collateral and the terms proposed by the borrower.

### 2. Evaluating a Request

As a lender, you are responsible for assessing the value of the collateral relative to the loan amount. Consider:
* **The Asset:** Is the collateral a desirable and valuable `ExperienceNFT`?
* **The Terms:** Does the interest (Repayment Amount - Principal Amount) represent a good return for the risk and duration?

### 3. Funding a Loan

If you find a request you'd like to fund:
1.  Click the **"Fund Loan"** button.
2.  A confirmation modal will summarize the terms.
3.  When you approve the transaction, the `principal amount` is sent from your wallet to the borrower. Your wallet address is now recorded in a new `ActiveLoan` object as the lender.

### 4. Managing Your Active Loans

You can view all the loans you have funded in your **Dashboard** under the **"My Loans"** tab in the "Loans I've Lended" section.

### 5. Outcomes

* **Successful Repayment:** When the borrower repays the loan, you will **automatically receive the full repayment amount** in your wallet. The platform fee is deducted from your profit, not the principal.
* **Default & Liquidation:** If the borrower does not repay the loan by the due date, the loan is considered in default. A **"Liquidate"** button will appear on the loan card in your dashboard. Clicking this will trigger a transaction that **transfers the collateralized NFT or Fraction directly to your wallet**, settling the debt.
