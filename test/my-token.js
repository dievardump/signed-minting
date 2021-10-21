const { expect } = require('chai');
const { deployments, getNamedAccounts, ethers } = require('hardhat');

const toBN = ethers.BigNumber.from;

describe('SignedAllowances', () => {
    let deployer;
    let random;
    let random2;
    let signer;
    let nftContract;
    const ADDRESS_ZERO = ethers.constants.AddressZero;

    async function signAllowance(account, nonce, signerAccount = signer) {
        const message = await nftContract.createMessage(account, nonce);
        const signature = await signerAccount.signMessage(
            ethers.utils.arrayify(message),
        );

        return signature;
    }

    async function signAllowanceForTier(
        account,
        nonce,
        tier,
        signerAccount = signer,
    ) {
        // create a "big" number with tier in it, and add "nonce" to it
        const tierStart = toBN(2).pow(128);
        const tierBN = tierStart.mul(tier);
        const nonceWithTier = tierBN.add(nonce);

        const message = await nftContract.createMessage(account, nonceWithTier);
        const signature = await signerAccount.signMessage(
            ethers.utils.arrayify(message),
        );

        return { nonce: nonceWithTier, signature };
    }

    beforeEach(async () => {
        [deployer, signer, random, random2] = await ethers.getSigners();

        const MyToken = await ethers.getContractFactory('MyToken', deployer);
        nftContract = await MyToken.deploy(await signer.getAddress());
    });

    describe('Minting OK', async function () {
        it('can mint with a signature', async function () {
            const nonce = 1;
            const allowance = await signAllowance(
                await random.getAddress(),
                nonce,
            );

            await nftContract.connect(random).guardedMint(nonce, allowance);

            expect(
                await nftContract.balanceOf(await random.getAddress()),
            ).to.be.equal(1);
        });

        it('can mint for another account with a signature', async function () {
            const nonce = 1;
            const allowance = await signAllowance(
                await random.getAddress(),
                nonce,
            );

            await nftContract
                .connect(random2)
                .guardedMintFor(await random.getAddress(), nonce, allowance);

            expect(
                await nftContract.balanceOf(await random.getAddress()),
            ).to.be.equal(1);
        });

        it('can mint batch with a signature', async function () {
            const nonce = 5;
            const allowance = await signAllowance(
                await random.getAddress(),
                nonce,
            );

            await nftContract
                .connect(random)
                .guardedMintBatch(nonce, allowance);

            expect(
                await nftContract.balanceOf(await random.getAddress()),
            ).to.be.equal(nonce);
        });

        it('can mint batch for another account with a signature', async function () {
            const nonce = 5;
            const allowance = await signAllowance(
                await random.getAddress(),
                nonce,
            );

            await nftContract
                .connect(random2)
                .guardedMintBatchFor(
                    await random.getAddress(),
                    nonce,
                    allowance,
                );

            expect(
                await nftContract.balanceOf(await random.getAddress()),
            ).to.be.equal(5);
        });

        it('can mint in current tier with a signature for current tier', async function () {
            const nonce = 1;
            let tier = 1;

            // first set tier 1 in contract, then sign and mint for tier 1
            {
                await nftContract.setTier(tier);

                const { nonce: tierNonce, signature: allowance } =
                    await signAllowanceForTier(
                        await random.getAddress(),
                        nonce,
                        tier,
                    );

                await nftContract
                    .connect(random)
                    .guardedTierMinting(tierNonce, allowance);

                expect(
                    await nftContract.balanceOf(await random.getAddress()),
                ).to.be.equal(1);
            }

            // then set tier 2 in contract, then sign and mint for tier 2
            {
                tier++;

                await nftContract.setTier(tier);

                const { nonce: tierNonce, signature: allowance } =
                    await signAllowanceForTier(
                        await random.getAddress(),
                        nonce,
                        tier,
                    );

                await nftContract
                    .connect(random)
                    .guardedTierMinting(tierNonce, allowance);

                expect(
                    await nftContract.balanceOf(await random.getAddress()),
                ).to.be.equal(2);
            }
        });

        it('can mint in current tier for another account with a signature for current tier', async function () {
            const nonce = 1;
            let tier = 1;

            // first set tier 1 in contract, then sign and mint for tier 1
            {
                await nftContract.setTier(tier);

                const { nonce: tierNonce, signature: allowance } =
                    await signAllowanceForTier(
                        await random.getAddress(),
                        nonce,
                        tier,
                    );

                await nftContract
                    .connect(random2)
                    .guardedTierMintingFor(
                        await random.getAddress(),
                        tierNonce,
                        allowance,
                    );

                expect(
                    await nftContract.balanceOf(await random.getAddress()),
                ).to.be.equal(1);
            }

            // then set tier 2 in contract, then sign and mint for tier 2
            {
                tier++;

                await nftContract.setTier(tier);

                const { nonce: tierNonce, signature: allowance } =
                    await signAllowanceForTier(
                        await random.getAddress(),
                        nonce,
                        tier,
                    );

                await nftContract
                    .connect(random2)
                    .guardedTierMintingFor(
                        await random.getAddress(),
                        tierNonce,
                        allowance,
                    );

                expect(
                    await nftContract.balanceOf(await random.getAddress()),
                ).to.be.equal(2);
            }
        });

        it('can mint batch in current tier with a signature for current tier', async function () {
            const nonce = 3;
            let tier = 1;

            // first set tier 1 in contract, then sign and mint for tier 1
            {
                await nftContract.setTier(tier);

                const { nonce: tierNonce, signature: allowance } =
                    await signAllowanceForTier(
                        await random.getAddress(),
                        nonce,
                        tier,
                    );

                await nftContract
                    .connect(random)
                    .guardedTierMintingBatch(tierNonce, allowance);

                expect(
                    await nftContract.balanceOf(await random.getAddress()),
                ).to.be.equal(nonce);
            }

            // then set tier 2 in contract, then sign and mint for tier 2
            {
                tier++;
                await nftContract.setTier(tier);

                const { nonce: tierNonce, signature: allowance } =
                    await signAllowanceForTier(
                        await random.getAddress(),
                        nonce,
                        tier,
                    );

                await nftContract
                    .connect(random)
                    .guardedTierMintingBatch(tierNonce, allowance);

                expect(
                    await nftContract.balanceOf(await random.getAddress()),
                ).to.be.equal(nonce * 2);
            }
        });

        it('can mint batch in current tier for another account with a signature for current tier', async function () {
            const nonce = 3;
            let tier = 1;

            // first set tier 1 in contract, then sign and mint for tier 1
            {
                await nftContract.setTier(tier);

                const { nonce: tierNonce, signature: allowance } =
                    await signAllowanceForTier(
                        await random.getAddress(),
                        nonce,
                        tier,
                    );

                await nftContract
                    .connect(random2)
                    .guardedTierMintingBatchFor(
                        await random.getAddress(),
                        tierNonce,
                        allowance,
                    );

                expect(
                    await nftContract.balanceOf(await random.getAddress()),
                ).to.be.equal(nonce);
            }

            // then set tier 2 in contract, then sign and mint for tier 2
            {
                tier++;

                await nftContract.setTier(tier);

                const { nonce: tierNonce, signature: allowance } =
                    await signAllowanceForTier(
                        await random.getAddress(),
                        nonce,
                        tier,
                    );

                await nftContract
                    .connect(random2)
                    .guardedTierMintingBatchFor(
                        await random.getAddress(),
                        tierNonce,
                        allowance,
                    );

                expect(
                    await nftContract.balanceOf(await random.getAddress()),
                ).to.be.equal(nonce * 2);
            }
        });
    });

    describe('Minting FAILS', async function () {
        it('can not reuse a signature', async function () {
            const nonce = 1;
            const allowance = await signAllowance(
                await random.getAddress(),
                nonce,
            );

            await nftContract.connect(random).guardedMint(nonce, allowance);

            expect(
                await nftContract.balanceOf(await random.getAddress()),
            ).to.be.equal(1);

            await expect(
                nftContract.connect(random).guardedMint(nonce, allowance),
            ).to.be.revertedWith('!ALREADY_USED!');
        });

        it('can not tamper with a signature', async function () {
            const nonce = 1;
            let allowance = await signAllowance(
                await random.getAddress(),
                nonce,
            );

            // change the first 10 characters of the signature
            allowance =
                '0x00000000' + allowance.substr(-(allowance.length - 10));

            await expect(
                nftContract.connect(random).guardedMint(nonce, allowance),
            ).to.be.revertedWith('ECDSA: invalid signature');
        });

        it('can not mint with another signer signature', async function () {
            const nonce = 1;

            let allowance = await signAllowance(
                await random.getAddress(),
                nonce,
            );

            // change signer in the contract
            await nftContract.setAllowancesSigner(await random2.getAddress());

            // the signature itself is valid, however not coming from the signer in the contract
            await expect(
                nftContract.connect(random).guardedMint(nonce, allowance),
            ).to.be.revertedWith('!INVALID_SIGNATURE!');
        });

        it('can not use another account allowance for myself', async function () {
            const nonce = 1;

            // create an allowance for random2
            const allowance = await signAllowance(
                await random2.getAddress(),
                nonce,
            );

            // try to use random2 allowance on random
            await expect(
                nftContract.connect(random).guardedMint(nonce, allowance),
            ).to.be.revertedWith('!INVALID_SIGNATURE!');

            await expect(
                nftContract
                    .connect(random)
                    .guardedMintFor(
                        await random.getAddress(),
                        nonce,
                        allowance,
                    ),
            ).to.be.revertedWith('!INVALID_SIGNATURE!');
        });

        it('can not use another tier signature', async function () {
            const nonce = 1;
            let tier = 1;

            // sign for tier 1
            const { nonce: tierNonce, signature: allowance } =
                await signAllowanceForTier(
                    await random.getAddress(),
                    nonce,
                    tier,
                );

            // set tier to 2 in contract
            await nftContract.setTier(2);

            await expect(
                nftContract
                    .connect(random)
                    .guardedTierMinting(tierNonce, allowance),
            ).to.be.revertedWith('!WRONG_TIER!');
        });
    });
});
