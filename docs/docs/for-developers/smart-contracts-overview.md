---
title: Smart Contracts Overview
---

# Smart Contracts Overview

The TokenTrip protocol is built on a modular architecture, with different smart contract packages handling specific responsibilities. All contracts are written in Sui Move.

### Our Core Packages

1.  **`tokentrip_token`**: The Mint.
    * This simple package's only job is to define the `TKT` fungible token standard, its name, symbol, and decimals. It creates the `TreasuryCap` used for minting the total supply.

2.  **`tokentrip_experiences`**: The Marketplace Engine.
    * This is the largest and most complex contract. It handles the logic for:
        * Provider Profiles
        * Experience NFTs (minting and metadata)
        * Listings (primary and secondary sales)
        * Purchases (in SUI and TKT)
        * On-chain Royalties and Fee Collection
        * The Reputation System (Reviews and Purchase Receipts)

3.  **`tokentrip_staking`**: The Bank.
    * This contract manages the DeFi aspects of the TKT token. It contains the `StakingPool` where users can deposit their TKT to earn rewards. It handles the logic for staking, unstaking, and reward calculation/distribution.

4.  **`tokentrip_dao`**: The Government.
    * This contract manages the entire governance process. It allows users to create flexible proposals, vote with their staked TKT, and execute passed proposals. It also holds the `DAOTreasury` which receives a portion of the protocol's revenue.

A detailed API reference for each function is in progress and will be published soon.