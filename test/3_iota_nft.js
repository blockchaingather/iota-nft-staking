require('dotenv').config();
const {
  BN,
  time,
  expectEvent,
  expectRevert,
} = require('@openzeppelin/test-helpers');

const { expect } = require('chai');
let iotaERC20;
let iotaERC721;
let IotaNftStaking;
let owner;
let addr1;
let addr2;
let addrs;
const initialSupply = '1000000000';
describe('Iota Nft Staking Token Contract', function () {
  function parseEther(etherCount) {
    return ethers.utils.parseEther(etherCount);
  }
  function format2Ether(weiCount) {
    return ethers.utils.formatUnits(weiCount, 'ether');
  }
  async function getBlockTimestamp(receipt) {
    return (await ethers.provider.getBlock(receipt.blockNumber)).timestamp;
  }
  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    // 1. deploy iota erc20
    const IotaERC20Factory = await ethers.getContractFactory('IotaERC20');
    iotaERC20 = await IotaERC20Factory.deploy(
      'IotaNftStaking', // name
      'INS', // symbol
    );
    await iotaERC20.deployed();
    // console.log('IotaERC20 deployed to %s', iotaERC20.address)

    // 2. deploy iota erc721
    const IotaERC721Factory = await ethers.getContractFactory('IotaERC721');
    iotaERC721 = await IotaERC721Factory.deploy('IOTA-721', 'IOTA721');
    await iotaERC721.deployed();
    await iotaERC721.mint('QmWKqwMJQHSfpfRFGUVGPFFtkBJ5WkFzhjQpruhSLtLWXB');
    // console.log('IotaERC721 deployed to %s', iotaERC721.address)

    // 3. deploy iota NftStaking
    const IotaNftFactory = await ethers.getContractFactory('IotaNftStaking');
    IotaNftStaking = await IotaNftFactory.deploy(iotaERC20.address);
    await IotaNftStaking.deployed();
  });

  describe('test func fundingContact', async () => {
    const erc20Token = 1000;
    it('1st test fund amount greater than 0, erc20 balanceof', async () => {
      // erc20 approve iota nft address
      await iotaERC20.approve(IotaNftStaking.address, erc20Token);
      await IotaNftStaking.fundingContact(erc20Token);
      expect(await iotaERC20.balanceOf(owner.address)).to.equal(
        '999999999999999999999999000',
      );
      expect(await IotaNftStaking.funding(owner.address)).to.equal(erc20Token);
    });
    it('2nd test fund amount greater than 0, iota nft balanceof', async () => {
      // erc20 approve iota nft address
      await iotaERC20.approve(IotaNftStaking.address, erc20Token);

      await IotaNftStaking.fundingContact(erc20Token);
      console.log(
        'IotaNftStaking.funding:',
        await IotaNftStaking.funding(owner.address),
      );

      expect(await IotaNftStaking.funding(owner.address)).to.equal(erc20Token);
    });

    it('3rd test no approve erc20 insufficient allowance', async () => {
      await expectRevert(
        IotaNftStaking.fundingContact(erc20Token),
        'ERC20: insufficient allowance',
      );
    });

    it('4th test emit event', async () => {
      await iotaERC20.approve(IotaNftStaking.address, erc20Token);
      const { txHash } = await IotaNftStaking.fundingContact(erc20Token);
      expectEvent.inTransaction(txHash, IotaNftStaking, 'ContractFunded', {
        sender: owner.address,
        amount: erc20Token,
        timestamp: await getBlockTimestamp(owner.address),
      });
    });
  });

  describe('test func setBaseApy', async () => {
    const baseApy = 12;
    it('1st test pay greater than 0', async () => {
      await IotaNftStaking.setBaseApy(baseApy);
      expect(await IotaNftStaking.baseApy()).to.equal(baseApy);
    });
    it('2nd test onlyOwner', async () => {
      await expectRevert(
        IotaNftStaking.connect(addr1).setBaseApy(baseApy),
        'Ownable: caller is not the owner',
      );
    });
    it('3rd test emit event', async () => {
      const { txHash } = await IotaNftStaking.setBaseApy(baseApy);
      expectEvent.inTransaction(txHash, IotaNftStaking, 'BaseApySet', {
        value: baseApy,
        sender: owner.address,
      });
    });
  });

  describe('test func setLockPeriod', async () => {
    const lockPeriod = 300;
    it('1st test lockDays greater than 0', async () => {
      await IotaNftStaking.setLockPeriod(lockPeriod);
      expect(await IotaNftStaking.lockPeriodDays()).to.equal(lockPeriod);
    });
    it('2nd test onlyOwner', async () => {
      await expectRevert(
        IotaNftStaking.connect(addr1).setLockPeriod(lockPeriod),
        'Ownable: caller is not the owner',
      );
    });
    it('3rd test emit event', async () => {
      const { txHash } = await IotaNftStaking.setLockPeriod(lockPeriod);
      expectEvent.inTransaction(txHash, IotaNftStaking, 'LockPeriodSet', {
        value: lockPeriod,
        sender: owner.address,
      });
    });
  });

  describe('test func setBaseRewardPrincipal', async () => {
    const rewarderc20Token = 1000;
    it('1st test rewardPrincipal greater than 0', async () => {
      await IotaNftStaking.setBaseRewardPrincipal(rewarderc20Token);
      expect(await IotaNftStaking.baseRewardPrincipal()).to.equal(
        rewarderc20Token,
      );
    });
    it('2nd test onlyOwner', async () => {
      await expectRevert(
        IotaNftStaking.connect(addr1).setBaseRewardPrincipal(rewarderc20Token),
        'Ownable: caller is not the owner',
      );
    });
    it('3rd test emit event', async () => {
      const { txHash } = await IotaNftStaking.setBaseRewardPrincipal(
        rewarderc20Token,
      );
      expectEvent.inTransaction(
        txHash,
        IotaNftStaking,
        'BaseRewardPrincipalSet',
        {
          value: rewarderc20Token,
          sender: owner.address,
        },
      );
    });
  });

  describe('test func withdraw', async () => {
    it('1st test funding enough', async () => {
      console.log(
        'IotaNftStaking.totalFunding:',
        await IotaNftStaking.totalFunding(),
      );
      await IotaNftStaking.withdraw();
      expect(await IotaNftStaking.funding(owner.address)).to.equal(0);
      expect(await iotaERC20.balanceOf(owner.address)).to.equal(
        parseEther(initialSupply),
      );
    });

    it('2nd test onlyOwner', async () => {
      await expectRevert(
        IotaNftStaking.connect(addr1).withdraw(),
        'Ownable: caller is not the owner',
      );
    });
  });

  describe('test func stake nft', async () => {
    const tokenId = 1;
    beforeEach(async function () {
      await iotaERC721.approve(IotaNftStaking.address, tokenId);
    });
    it('1st test stake nft must be erc721 token', async () => {
      await expectRevert(
        IotaNftStaking.stakeNft(addr1.address, tokenId),
        'stakeNft: must be contract address',
      );
    });
    it('2nd test stake nft balance', async () => {
      await IotaNftStaking.stakeNft(iotaERC721.address, tokenId);
      expect(await iotaERC721.balanceOf(IotaNftStaking.address)).to.equal(1);
    });
    it('3rd test stake nft reward info', async () => {
      await IotaNftStaking.stakeNft(iotaERC721.address, tokenId);
      const [
        baseApy,
        lockPeriodDays,
        rewardPrincipal,
        stakeTime,
        interestClaimed,
      ] = await IotaNftStaking.stakeNftRewardInfo(
        iotaERC721.address,
        tokenId,
        owner.address,
      );

      expect(baseApy).to.equal(10);
      expect(lockPeriodDays).to.equal(31536000);
      expect(String(rewardPrincipal)).to.equal('1000000000000000000000');
      expect(stakeTime).to.equal(await getBlockTimestamp(owner.address));
      expect(interestClaimed).to.equal(0);
    });

    it('4th test stake nft emit event', async () => {
      const [
        baseApy,
        lockPeriodDays,
        rewardPrincipal,
        stakeTime,
        interestClaimed,
      ] = await IotaNftStaking.stakeNftRewardInfo(
        iotaERC721.address,
        tokenId,
        owner.address,
      );
      const { txHash } = await IotaNftStaking.stakeNft(
        iotaERC721.address,
        tokenId,
      );
      expectEvent.inTransaction(txHash, IotaNftStaking, 'Nftstaked', {
        sender: owner.address,
        nftAddress: iotaERC721.address,
        nftId: tokenId,
        rewardAmount: rewardPrincipal,
        timestamp: stakeTime,
      });
    });
  });

  describe('test func unstake nft', async () => {
    const tokenId = 1;
    it('1st test unstake nft must be erc721 token', async () => {
      await expectRevert(
        IotaNftStaking.unstakeNft(addr1.address, tokenId),
        'unstakeNft: must be contract address',
      );
    });

    it('2nd test unstake nft don’t have nft staked', async () => {
      await expectRevert(
        IotaNftStaking.unstakeNft(iotaERC721.address, tokenId),
        "unstakeNft: don't have nft staked",
      );
    });

    it('3rd test unstake nft still within lock period', async () => {
      await iotaERC721.approve(IotaNftStaking.address, tokenId);
      await IotaNftStaking.stakeNft(iotaERC721.address, tokenId);
      await expectRevert(
        IotaNftStaking.unstakeNft(iotaERC721.address, tokenId),
        'unstakeNft: still within lock period',
      );
    });

    it('4th test unstake nft totalFunding no enough transfer failed', async () => {
      // set lock period days
      await IotaNftStaking.setLockPeriod(1);
      await iotaERC721.approve(IotaNftStaking.address, tokenId);
      await IotaNftStaking.stakeNft(iotaERC721.address, tokenId);

      const sixMonths = new BN(24 * 60 * 60 * 180);
      await time.increase(sixMonths);

      await IotaNftStaking.withdraw();

      const [
        baseApy,
        lockPeriodDays,
        rewardPrincipal,
        stakeTime,
        interestClaimed,
      ] = await IotaNftStaking.stakeNftRewardInfo(
        iotaERC721.address,
        tokenId,
        owner.address,
      );
      const { txHash } = await IotaNftStaking.unstakeNft(
        iotaERC721.address,
        tokenId,
      );
      expectEvent.inTransaction(txHash, IotaNftStaking, 'NftUnstaked', {
        sender: owner.address,
        nftAddress: iotaERC721.address,
        nftId: tokenId,
        rewardAmount: rewardPrincipal,
        timestamp: stakeTime,
      });
    });
  });

  describe('test func claim', async () => {
    const tokenId = 1;
    it('1st test must be erc721 token', async () => {
      await expectRevert(
        IotaNftStaking.claim(addr1.address, tokenId),
        'claim: must be contract address',
      );
    });
    it('2nd test don‘t have nft staked direct claim', async () => {
      await expectRevert(
        IotaNftStaking.claim(iotaERC721.address, tokenId),
        "claim: don't have nft staked",
      );
    });
    it('3rd test no interest to claim', async () => {
      await iotaERC721.approve(IotaNftStaking.address, tokenId);
      await IotaNftStaking.stakeNft(iotaERC721.address, tokenId);
      await expectRevert(
        IotaNftStaking.claim(iotaERC721.address, tokenId),
        'claim: no interest to claim',
      );
    });
    it('4th test interest claim transfer failed', async () => {
      const sixMonths = new BN(24 * 60 * 60 * 180);
      await time.increase(sixMonths);
      await iotaERC721.approve(IotaNftStaking.address, tokenId);
      await IotaNftStaking.stakeNft(iotaERC721.address, tokenId);
      await expectRevert(
        IotaNftStaking.claim(iotaERC721.address, tokenId),
        'claim: no interest to claim',
      );
    });
    it('5th test interest claim transfer success', async () => {
      await iotaERC721.approve(IotaNftStaking.address, tokenId);
      await IotaNftStaking.stakeNft(iotaERC721.address, tokenId);
      const sixMonths = new BN(24 * 60 * 60 * 180);
      await time.increase(sixMonths);
      const [
        baseApy,
        lockPeriodDays,
        rewardPrincipal,
        stakeTime,
        interestClaimed,
      ] = await IotaNftStaking.stakeNftRewardInfo(
        iotaERC721.address,
        tokenId,
        owner.address,
      );
      const interest = rewardPrincipal * (1 + baseApy / 36500) ** 180;
      console.log(await iotaERC20.balanceOf(owner.address), interest);
      expect(iotaERC20.balanceOf(owner.address)).to.equal(interest);
    });
    it('6th test emit event', async () => {
      const erc20Token = 1000000000000;
      await iotaERC20.approve(IotaNftStaking.address, erc20Token);
      await IotaNftStaking.fundingContact(erc20Token);
      await iotaERC721.approve(IotaNftStaking.address, tokenId);
      await IotaNftStaking.setBaseRewardPrincipal(1);
      await IotaNftStaking.stakeNft(iotaERC721.address, tokenId);
      const tenDays = new BN(24 * 60 * 60 * 10);
      await time.increase(tenDays);

      const [
        baseApy,
        lockPeriodDays,
        rewardPrincipal,
        stakeTime,
        interestClaimed,
      ] = await IotaNftStaking.stakeNftRewardInfo(
        iotaERC721.address,
        1,
        owner.address,
      );
      const { txHash } = await IotaNftStaking.claim(
        iotaERC721.address,
        tokenId,
      );
      expectEvent.inTransaction(txHash, IotaNftStaking, 'Claimed', {
        sender: owner.address,
        nftAddress: iotaERC721.address,
        nftId: tokenId,
        principal: rewardPrincipal,
        interest: interestClaimed,
        claimTimestamp: await getBlockTimestamp(owner.address),
      });
    });
  });
});
