---
sidebar_position: 3
title: Guide for Bidders
---

# Guide for Bidders

Participating in a TokenTrip auction is a seamless and secure on-chain experience.

### Step 1: Find an Auction

Navigate to the "Auctions" page to see all currently active listings. You can see the current highest bid and the time remaining for each item. Click on any auction to view its details.

### Step 2: Place a Bid

On the auction's detail page, you can place your bid.

* The auction will clearly state whether it accepts **SUI** or **TKT**.
* Your bid must be higher than the current `highest_bid`.
* If you are the first bidder, your bid must be equal to or greater than the `start_price`.

When you submit your bid, you will be prompted to approve a transaction that sends your bid amount (e.g., your `Coin<SUI>`) to the smart contract.

### Step 3: What Happens if You're Outbid?

This is a key feature of our fair auction system. The moment another user places a higher bid than yours, the smart contract **automatically and instantly refunds your entire previous bid** directly to your wallet. Your funds are never locked unnecessarily.

### Step 4: Winning and Settling an Auction

If you are the highest bidder when the auction timer ends, you are the winner!

Once the auction is over, it needs to be "settled". This is the final transaction that distributes the assets. A "Settle Auction" button will become available on the page. **Anyone** (the winner, the seller, or any community member) can click this button to trigger the finalization.

Once settled, you will automatically receive the `ExperienceNFT` in your wallet.
