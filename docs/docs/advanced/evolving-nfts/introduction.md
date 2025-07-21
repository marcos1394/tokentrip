---
title: Introduction to Evolving NFTs
---

# Introduction to Evolving NFTs

Evolving NFTs are dynamic digital assets that change their metadata (like their image or attributes) based on pre-programmed on-chain rules. Instead of being a static image, an Evolving NFT has a life of its own, reacting to time or specific achievements.

This functionality turns a simple collectible into an engaging, interactive asset whose story and value can grow over time.

### How It Works

At the moment of creation, a provider can embed a set of "Evolution Rules" directly into the NFT's on-chain data. These rules are transparent and verifiable by anyone. Each rule consists of:

* **A Trigger:** The condition that must be met. We currently support two types:
    * **Time-Based:** The NFT can evolve after a specific date and time.
    * **Goal-Based:** The NFT can evolve after an on-chain goal is met (e.g., its provider reaches 50 total reviews).
* **An Outcome:** The new metadata that will be applied to the NFT, such as a new image, a new description, or new attributes.

Once a trigger's condition is met, anyone can call the `evolve_experience` function to apply the changes to the NFT, forever updating its on-chain state.
