---
title: Guide for Borrowers
---

# Lending: Guide for Borrowers

Need liquidity? Use your valuable `ExperienceNFTs` or `Fractions` as collateral to request a loan from the community.

### 1. Creating a Loan Request

1.  Navigate to your **Dashboard** and find the asset you wish to use as collateral in your "My Collection" or "My Inventory" tab.
2.  From the asset's "Actions" menu, select **"Request Loan"**.
3.  A modal will appear, prompting you to define the terms of your loan:
    * **Currency:** Choose whether you want to borrow **SUI** or **TKT**.
    * **Borrow Amount (Principal):** The amount you wish to receive from a lender.
    * **Repayment Amount:** The total amount you will pay back at the end of the term. The difference between this and the principal is the interest you are offering the lender.
    * **Loan Duration:** The length of the loan (e.g., 7, 14, or 30 days).
4.  Submit the transaction. Your asset will be transferred into a publicly visible `LoanRequest` object on the `/lending` marketplace, held securely in escrow.

### 2. Receiving Funds

Once a lender decides to fund your request, the `principal amount` you requested is **instantly and automatically** transferred to your wallet. Your `LoanRequest` is converted into an `ActiveLoan`, which you can view in your Dashboard.

### 3. Repaying the Loan

In your Dashboard, under the **"My Loans"** tab, you will find a section for "Loans I've Borrowed".
* Before the due date, you can click the **"Repay"** button.
* You will be prompted to sign a transaction to send the full `repayment_amount`.
* Upon confirmation, the repayment is sent to the lender, and your collateralized NFT or Fraction is **instantly and automatically returned** to your wallet.
