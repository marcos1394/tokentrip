---
title: Introduction to P2P Lending
---

# Introduction to P2P Lending

The TokenTrip P2P (Peer-to-Peer) Lending Marketplace allows users to unlock the liquidity of their digital assets without having to sell them. It functions as a decentralized, trustless "pawn shop" for `ExperienceNFTs` and `Fractions`.

This system creates a new financial layer on top of the experience economy, driven by two key roles:

* **The Borrower:** An owner of a valuable asset (like a rare NFT or a fraction of a luxury package) who needs short-term liquidity.
* **The Lender:** A user with available capital (SUI or TKT) who wants to earn a yield by funding secure, collateralized loans.

### Core Principles

Our lending market is built on a foundation of decentralization and transparency:

* **Peer-to-Peer:** All loan terms (principal, repayment, duration) are set by the borrower and agreed upon by the lender. There is no central authority dictating interest rates.
* **Oracle-less:** The value of the collateral is not determined by an external price feed. Instead, its value is assessed by the open market of lenders who decide whether a loan is worth funding.
* **On-Chain Escrow:** The collateral asset is locked in a secure smart contract (`ActiveLoan` object) for the duration of the loan, guaranteeing its availability for either repayment or liquidation.
* **Trustless Settlement:** Both repayment (returning the asset to the borrower) and liquidation (transferring the asset to the lender upon default) are atomic, on-chain actions that execute exactly as programmed.
