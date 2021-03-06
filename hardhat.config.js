require('dotenv').config();
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
const argv = require('yargs/yargs')()
  .env('')
  .options({
    coverage: {
      type: 'boolean',
      default: false,
    },
  }).argv;

if (argv.coverage) {
  require('solidity-coverage');
}
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {},
    local: {
      url: 'http://127.0.0.1:8545', // suggest using ganache-cli when doing test case
    },
    iota_evm: {
      url: 'https://evm.wasp.sc.iota.org',
      chainId: 1074,
      accounts: [process.env.IOTA_ACCOUNT_PRIVATE_KEY],
      timeout: 60000
    }
  },
  solidity: {
    version: '0.8.7',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    require: 'hardhat/register',
    timeout: 20000,
  },
};