const { expect } = require('chai');

let Token;
let hardhatToken;
let owner;
let addr1;
let addr2;
let addrs;

describe('IotaERC721', async () => {
  const name = 'Iota Nft Staking';
  const symbol = 'INS';
  const ipfsHash = 'QmWKqwMJQHSfpfRFGUVGPFFtkBJ5WkFzhjQpruhSLtLWXB';
  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async () => {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Token = await ethers.getContractFactory('IotaERC721');
    hardhatToken = await Token.deploy(name, symbol);
    await hardhatToken.deployed();
  });

  describe('test func mint', async () => {
    it('1st test tokenId', async () => {
      const { nonce } = await hardhatToken.mint(ipfsHash);
      expect(nonce).to.gte(1);
    });
  });

  describe('test func setBaseURI', async () => {
    it('1st test prefixUri', async () => {
      await hardhatToken.setBaseURI('https://ipfs.io');
      expect(await hardhatToken.prefixUri()).to.equal('https://ipfs.io');
    });
  });
  describe('test func tokenURI', async () => {
    it('1st test token uri', async () => {
      await hardhatToken.mint(ipfsHash);
      expect(await hardhatToken.tokenURI(1)).to.equal(
        'https://ipfs.io/ipfs/' + ipfsHash,
      );
    });
  });
});
