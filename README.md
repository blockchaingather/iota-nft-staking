# iota-nft

Iota Nft Staking contract

## 1. Development Environment

- Node v14.16.1
- Hardhat v2.9.1
- Solidity - ^0.8.7 (solc-js)
- ethers.js v5.6.1
- Ganache CLI v6.12.2 (ganache-core: 2.13.2) on port 8545
- Ganache GUI v2.5.4 (ganache-core: 2.13.2) on port 7545

The smart contract is deployed and fully tested on the local Ethereum VM.

## 2. File structures

contracts

- abdk-libraries - Library of mathematical functions operating with IEEE 754 quadruple precision (128 bit) floating point numbers.
- Calculator.sol - Tools for calculating rewards.
- IotaERC20.sol -  Official ERC20 contract.
- IotaERC721.sol - Official ERC721 contract.
- IotaNftStaking.sol - Staking smart contract where users can connect via metamask and stake NFTs.

## 3. Run the project

### 3.1. Clone code and install dependencies

```javascript
git clone this-project-code
```

```javascript
cd /path/to/this/project/folder/
```

Run command to install package dependencies;

```javascript
npm install
```

### 3.2. Run a local blockchain

I run Ganache GUI on port 7545, as it provides a better view;

If you use Ganache GUI too, make sure to go to "Setting", "Accounts & Keys";

If you prefer Ganache-CLI, change the port to 8545 in these files
hardhat.config.js

next, launch ganache-cli with 50 accounts

ganache-cli -a 50

### 3.3. Compile 

#### 3.3.1. Compile
You can now compile

```javascript
npx hardhat compile
```
### 3.3.2.
restart Ganache GUI or ganache-cli

## 4. Attention
If you want to run the project, you should copy .env.example file and rename it to .env. And if you want to run project on other networks instead of the local development network, you should fill values in .env file, 6 parts below:

- RINKEBY_RPC_URL, MAINNET_RPC_URL --- rpc url, according to the NETWORK you choose
- ETHERSCAN_API_KEY --- etherscan api key


## 5. format contract code

```javascript
npm run lint:sol
```
## 6. Test the project

```javascript
npm run test:local
```
## 7. Test the project coverage
```javascript
npm run coverage
```
## 8. deploy contract 
```javascript
npm run deploy:local
```