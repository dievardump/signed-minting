const hre = require('hardhat');
const fs = require('fs').promises;

async function signMessage(recipient, nonce, contractAddress, signer) {
    const message = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
            ['address', 'uint256', 'address'],
            [recipient, nonce, contractAddress],
        ),
    );
    const signature = await signer.signMessage(ethers.utils.arrayify(message));
    return { message, signature };
}

async function main() {
    // here the signer is the second account in the hardhat configuration
    const [deployer, signer] = await hre.ethers.getSigners();

    // the contract address is needed for the signature
    const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

    if (!CONTRACT_ADDRESS) {
        throw new Error(
            'Please set the contract address to sign for in your .env file',
        );
    }

    const perAddress = {
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266': 1,
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8': 1,
    };

    const addresses = Object.keys(perAddress);

    const signedAllowances = {};
    let allowances = 0;
    for (let i = 0; i < addresses.length; i++) {
        const addr = addresses[i];
        const allowance = perAddress[addr];
        const { message, signature } = await signMessage(
            addr,
            allowance,
            CONTRACT_ADDRESS,
            signer,
        );

        signedAllowances[addr] = {
            allowance: allowance,
            message,
            signature,
        };
        allowances += allowance;
    }

    console.log('Sum of all allowances', allowances);

    console.log('Allowances:');

    // here you should probably use await fs.writeFile(file, content);
    console.log(JSON.stringify(signedAllowances));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
