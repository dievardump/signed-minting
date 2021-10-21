require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('hardhat-deploy');
require('hardhat-deploy-ethers');
require('hardhat-tracer');
require('@nomiclabs/hardhat-etherscan');
require('hardhat-gas-reporter');

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: {
        compilers: [
            {
                version: '0.8.0',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: '0.8.9',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {},
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
        },
        signer: {
            default: 1, // here this will by default take the second account as signer
        },
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS ? true : false,
        gasPrice: 21,
    },
};
