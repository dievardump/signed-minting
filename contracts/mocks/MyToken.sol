//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '../SignedAllowance.sol';

contract MyToken is Ownable, ERC721, SignedAllowance {
    uint256 public lastTokenId;

    uint256 public CURRENT_TIER;

    constructor(address allowancesSigner_) ERC721('My Token', 'TKN') {
        // set the signer
        _setAllowancesSigner(allowancesSigner_);
    }

    /// @notice sets allowance signer, this can be used to revoke all unused allowances already out there
    /// @param newSigner the new signer
    function setAllowancesSigner(address newSigner) external onlyOwner {
        _setAllowancesSigner(newSigner);
    }

    /// @notice sets current tier
    /// @param newTier the new tier
    function setTier(uint256 newTier) external onlyOwner {
        CURRENT_TIER = newTier;
    }

    /// @notice This function allows one mint per allowance.
    /// @param nonce the nonce
    /// @param signature the signature by the allowance wallet
    function guardedMint(uint256 nonce, bytes memory signature) external {
        // this will throw if the allowance has already been used or is not valid
        _useAllowance(msg.sender, nonce, signature);
        _safeMint(msg.sender, ++lastTokenId);
    }

    /// @notice This function allows to mint for another address
    ///         this can be great to mint directly to your Vault, or to pay for someone else mint
    ///         the NFT will still be minted to the account this allowance is linked to, not to caller
    /// @param account the account to mint to
    /// @param nonce the nonce
    /// @param signature the signature by the allowance wallet
    function guardedMintFor(
        address account,
        uint256 nonce,
        bytes memory signature
    ) external {
        // this will throw if the allowance has already been used or is not valid
        _useAllowance(account, nonce, signature);
        _safeMint(account, ++lastTokenId);
    }

    /// @notice This function allows `nonce` mint per allowance.
    /// @param nonce the nonce, which is also the number of mint allowed in one call
    /// @param signature the signature by the allowance wallet
    function guardedMintBatch(uint256 nonce, bytes memory signature) external {
        // this will throw if the allowance has already been used or is not valid
        _useAllowance(msg.sender, nonce, signature);

        // mint batch `nonce` elements to the caller
        _mintBatch(msg.sender, nonce);
    }

    /// @notice This function allows `nonce` mint per allowance, to `account`
    ///         this can be great to mint directly to your Vault, or to pay for someone else mint
    ///         the NFTs will still be minted to the account this allowance is linked to, not to caller
    /// @param nonce the nonce, which is also the number of mint allowed in one call
    /// @param signature the signature by the allowance wallet
    function guardedMintBatchFor(
        address account,
        uint256 nonce,
        bytes memory signature
    ) external {
        // this will throw if the allowance has already been used or is not valid
        _useAllowance(account, nonce, signature);

        // mint batch `nonce` elements to `account`
        _mintBatch(account, nonce);
    }

    /// @notice This function allows "tiers" minting, by bit packing the "tier" in the nonce
    ///         if CURRENT_TIER == 0, no check is performed
    /// @param nonce the nonce, that also contains the `tier`
    /// @param signature the signature by the allowance wallet
    function guardedTierMinting(uint256 nonce, bytes memory signature)
        external
    {
        // verifies that this nonce is for current tier
        // throws if not
        _validateTier(nonce);

        // this will throw if the allowance has already been used or is not valid
        _useAllowance(msg.sender, nonce, signature);

        //mint batch `allowance` elements to the caller
        _safeMint(msg.sender, ++lastTokenId);
    }

    /// @notice This function allows "tiers" minting, to `account`
    ///         if CURRENT_TIER == 0, no check is performed
    ///         this can be great to mint directly to your Vault, or to pay for someone else mint
    ///         the NFTs will still be minted to the account this allowance is linked to, not to caller
    /// @param account the account we mint for
    /// @param nonce the nonce, that also contains the `tier`
    /// @param signature the signature by the allowance wallet
    function guardedTierMintingFor(
        address account,
        uint256 nonce,
        bytes memory signature
    ) external {
        // verifies that this nonce is for current tier
        // throws if not
        _validateTier(nonce);

        // this will throw if the allowance has already been used or is not valid
        _useAllowance(account, nonce, signature);

        //mint batch `allowance` elements to the caller
        _safeMint(account, ++lastTokenId);
    }

    /// @notice This function allows "tiers" batch minting, by bit packing the "tier" in the nonce
    ///         if CURRENT_TIER == 0, no check is performed
    /// @param nonce the nonce, which is also the number of mint allowed in one call AND the tier
    /// @param signature the signature by the allowance wallet
    function guardedTierMintingBatch(uint256 nonce, bytes memory signature)
        external
    {
        // verifies that this nonce is for current tier
        // throws if not
        _validateTier(nonce);

        // this will throw if the allowance has already been used or is not valid
        _useAllowance(msg.sender, nonce, signature);

        // the right-most 128 bits are used to give the amount this user can mint at once
        uint256 allowance = uint256(uint128(nonce));

        //mint batch `allowance` elements to the caller
        _mintBatch(msg.sender, allowance);
    }

    /// @notice This function allows "tiers" batch minting, to `account`
    ///         if CURRENT_TIER == 0, no check is performed
    ///         this can be great to mint directly to your Vault, or to pay for someone else mint
    ///         the NFTs will still be minted to the account this allowance is linked to, not to caller
    /// @param account the account to mint to
    /// @param nonce the nonce, which is also the number of mint allowed in one call AND the tier
    /// @param signature the signature by the allowance wallet
    function guardedTierMintingBatchFor(
        address account,
        uint256 nonce,
        bytes memory signature
    ) external {
        // verifies that this nonce is for current tier
        // throws if not
        _validateTier(nonce);

        // this will throw if the allowance has already been used or is not valid
        _useAllowance(account, nonce, signature);

        // the right-most 128 bits are used to give the amount this user can mint at once
        uint256 allowance = uint256(uint128(nonce));

        //mint batch `allowance` elements to the caller
        _mintBatch(account, allowance);
    }

    /// @notice verifies that `nonce` is for current tier
    ///         if CURRENT_TIER == 0, we consider all nonce valids
    /// @param nonce the nonce to verify the account to mint to
    function _validateTier(uint256 nonce) internal view {
        uint256 currentTier = CURRENT_TIER;

        // tier is only checked if CURRENT_TIER is not 0, since 0 is considered "public tier"
        if (currentTier != 0) {
            // the left-most 128 bits are used to determine if this nonce is for the current tier
            uint256 nonceTier = nonce >> 128;
            require(currentTier == nonceTier, '!WRONG_TIER!');
        }
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
