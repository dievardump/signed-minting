# SignedAllowance

This repository contains a minimal contract and an example of how to use "off-chain signing" to manage things like tier-minting, early birds, etc... in NFT sale processes, without needing to save lists on-chain.

## mint, mintFor, mintBatch, mintBatchFor, mintTier, mintTierFor, mintBatchTier, mintBatchTierFor

The mock contract `contracts/mocks/MyToken.sol` contains various minting function allowing:

-   Account minting one token using an "allowance signature"
-   Account minting one token for another account (paying the gas), using an "allowance signature"
-   Account minting several tokens using an "allowance signature"
-   Account minting several tokens for another account (paying the gas), using an "allowance signature"
-   Account minting one token, with Tier verification (early bird, allow list, etc...), using an "allowance signature"
-   Account minting one token for another account (paying the gas), with Tier verification (early bird, allow list, etc...), using an "allowance signature"
-   Account minting several tokens, with Tier verification (early bird, allow list, etc...), using an "allowance signature"
-   Account minting several tokens for another account (paying the gas), with Tier verification (early bird, allow list, etc...), using an "allowance signature"

## Example

The tests contain all needed function to understand how to sign a message off-chain in order to allow people to mint, with authorization check.

# Extensible

The encoding of the Tier in the nonce is just an example. But it is also possible to encode things into 64 bits instead of 128, and add a "token price" in the nonce, on top of the tier and the actual nonce.

Lots of things possible here.

# Usage

See `contracts/mocks/` to see an extensive usage with tiers, batch mints etc...

`npm add --save-dev @0xdievardump/signed-allowances`

contract allowing users to mint using a signature

in this contract users have to mint there full allowance in the same call

```solidity
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@0xdievardump/contracts/SignedAllowance.sol';


contract MyToken is Ownable, ERC721, SignedAllowance {
    uint256 public lastTokenId;

    constructor(address allowancesSigner_) ERC721('My Token', 'TKN') {
        // set the signer
        _setAllowancesSigner(allowancesSigner_);
    }

    /// @notice sets allowance signer, this can be used to revoke all unused allowances already out there
    /// @param newSigner the new signer
    function setAllowancesSigner(address newSigner) external onlyOwner {
        _setAllowancesSigner(newSigner);
    }

    /// @notice This function allows one mint per allowance.
    /// @param nonce the nonce
    /// @param signature the signature by the allowance wallet
    function mint(uint256 nonce, bytes memory signature) external {
        // this will throw if the allowance has already been used or is not valid
        _useAllowance(msg.sender, nonce, signature);
        _safeMint(msg.sender, ++lastTokenId);
    }

    /// @notice This function allows `nonce` mint per allowance.
    /// @param nonce the nonce, which is also the number of mint allowed in one call
    /// @param signature the signature by the allowance wallet
    function mintBatch(uint256 nonce, bytes memory signature) external {
        // this will throw if the allowance has already been used or is not valid
        _useAllowance(msg.sender, nonce, signature);

        // mint batch `nonce` elements to the caller
        _mintBatch(msg.sender, nonce);
    }

    /// @notice allows to mint `howMany` to `account`
    /// @param account the account to mint to
    /// @param howMany how many to mint to this account
    function _mintBatch(address account, uint256 howMany) internal {
        uint256 tokenId = lastTokenId;
        for (uint256 i; i < howMany; i++) {
            _safeMint(account, ++tokenId);
        }

        lastTokenId = tokenId;
    }
}
```

contract allowing users to mint using a signature

in this contract we keep a mapping of how many elements were already minted with a signature

This way users can mint their full allowance in several calls

```solidity
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@0xdievardump/contracts/SignedAllowance.sol';

// contract allowing users to mint using a signature
// in this contract users can mint there full allowance in sevral calls

contract MyToken is Ownable, ERC721, SignedAllowance {
    uint256 public lastTokenId;

    mapping(bytes32 => uint256) public allowancesMinted;

    constructor(address allowancesSigner_) ERC721('My Token', 'TKN') {
        // set the signer
        _setAllowancesSigner(allowancesSigner_);
    }

    /// @notice sets allowance signer, this can be used to revoke all unused allowances already out there
    /// @param newSigner the new signer
    function setAllowancesSigner(address newSigner) external onlyOwner {
        _setAllowancesSigner(newSigner);
    }

    /// @notice This function allows `nonce` mint per allowance.
    /// @param howMany how many items the user wants to mint now
    /// @param nonce the nonce, which is also the number of mint allowed for this signature
    /// @param signature the signature by the allowance wallet
    function mintBatch(uint256 howMany, uint256 nonce, bytes memory signature) external {
        // this will throw if the signature is not the right one
        bytes32 signatureId = validateSignature(msg.sender, nonce, signature);

        uint256 alreadyMinted = allowancesMinted[signatureId];

        // verify we don't ask for too many
        requite(alreadyMinted + howMany <= nonce, "Too Many requested");

        // increment the counter of how many were minted for this signature
        allowancesMinted[signatureId] += howMany;

        // mint batch `nonce` elements to the caller
        _mintBatch(msg.sender, howMany);
    }

    /// @notice allows to mint `howMany` to `account`
    /// @param account the account to mint to
    /// @param howMany how many to mint to this account
    function _mintBatch(address account, uint256 howMany) internal {
        uint256 tokenId = lastTokenId;
        for (uint256 i; i < howMany; i++) {
            _safeMint(account, ++tokenId);
        }

        lastTokenId = tokenId;
    }
}
```
