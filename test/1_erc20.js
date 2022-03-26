const { expect } = require('chai');

let Token;
let hardhatToken;
let owner;
let addr1;
let addr2;
let addrs;

describe('IotaERC20', async () => {
  const initialSupply = '1000000000';
  const name = 'Iota Nft Staking';
  const symbol = 'INS';

  function parseEther(etherCount) {
    return ethers.utils.parseEther(etherCount);
  }
  function format2Ether(weiCount) {
    return ethers.utils.formatUnits(weiCount, 'ether');
  }

  console.log('initialSupply:', initialSupply);
  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async () => {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    Token = await ethers.getContractFactory('IotaERC20');
    hardhatToken = await Token.deploy('Iota Nft Staking', 'INS');
    await hardhatToken.deployed();
  });

  it('has a name', async () => {
    expect(await hardhatToken.name()).to.equal(name);
  });

  it('has a symbol', async () => {
    expect(await hardhatToken.symbol()).to.equal(symbol);
  });

  it('has 18 decimals', async () => {
    expect(await hardhatToken.decimals()).to.equal(18);
  });

  it('total supply', async () => {
    expect(await hardhatToken.totalSupply()).to.equal(
      parseEther(initialSupply),
    );
  });

  // You can nest describe calls to create subsections.
  describe('Deployment', function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.
    it('Should assign the total supply of tokens to the owner', async () => {
      const ownerBalance = await hardhatToken.balanceOf(owner.address);
      expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe('Transactions', function () {
    it('Should transfer tokens between accounts', async () => {
      // Transfer 50 tokens from owner to addr1
      await hardhatToken.transfer(addr1.address, 50);
      const addr1Balance = await hardhatToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await hardhatToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await hardhatToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it('Should update balances after transfers', async () => {
      const initialOwnerBalance = format2Ether(
        await hardhatToken.balanceOf(owner.address),
      );
      // Transfer 100 tokens from owner to addr1.
      await hardhatToken.transfer(addr1.address, parseEther('100'));

      // Transfer another 50 tokens from owner to addr2.
      await hardhatToken.transfer(addr2.address, parseEther('50'));

      // Check balances.
      const finalOwnerBalance = format2Ether(
        await hardhatToken.balanceOf(owner.address),
      );
      expect(Number(finalOwnerBalance)).to.equal(
        Number(initialOwnerBalance - 150),
      );

      const addr1Balance = format2Ether(
        await hardhatToken.balanceOf(addr1.address),
      );
      expect(Number(addr1Balance)).to.equal(100);

      const addr2Balance = format2Ether(
        await hardhatToken.balanceOf(addr2.address),
      );
      expect(Number(addr2Balance)).to.equal(50);
    });
  });
});
