# SignedAllowance

This repository contains a minimal contract and an example of how to use "off-chain signing" to manage things like tier-minting, early birds, etc... in NFT sale processes, without needing to save lists on-chain.

## mint, mintFor, mintBatch, mintBatchFor, mintTier, mintTierFor, mintBatchTier, mintBatchTierFor

The mock contract `contracts/mocks/MyToken.sol` contains various minting function allowing:

- Account minting one token using an "allowance signature"
- Account minting one token for another account (paying the gas), using an "allowance signature"
- Account minting several tokens using an "allowance signature"
- Account minting several tokens for another account (paying the gas), using an "allowance signature"
- Account minting one token, with Tier verification (early bird, whitelist, etc...), using an "allowance signature"
- Account minting one token for another account (paying the gas), with Tier verification (early bird, whitelist, etc...), using an "allowance signature"
- Account minting several tokens, with Tier verification (early bird, whitelist, etc...), using an "allowance signature"
- Account minting several tokens for another account (paying the gas), with Tier verification (early bird, whitelist, etc...), using an "allowance signature"

## Example

The tests contain all needed function to understand how to sign a message off-chain in order to allow people to mint, with authorization check.


