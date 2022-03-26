// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./library/Calculator.sol";

/**
 * iota nft staking
 */
contract IotaNftStaking is Context, Ownable, ReentrancyGuard, Pausable, ERC721Holder {
    using Address for address;
    using SafeMath for uint256;
    using Calculator for uint256;
    /**
     * Emitted when a user store farming rewards(ERC20 token).
     * @param sender User address.
     * @param amount Current store amount.
     * @param timestamp The time when store erc20 rewards.
     */
    event ContractFunded(address indexed sender, uint256 amount, uint256 timestamp);

    /**
     * Emitted when the owner claim remaining farming rewards.
     * @param sender User address.
     * @param amount Claim amount.
     * @param timestamp The time when claim remaining funding.
     */
    event FundingClaimed(address indexed sender, uint256 amount, uint256 timestamp);

    /**
     * Emitted when a new baseApy value is set.
     * @param value A new APY value.
     * @param sender The owner address at the moment of baseApy changing.
     */
    event BaseApySet(uint256 value, address sender);

    /**
     * Emitted when a new lockPeriodDays value is set.
     * @param value A new lock period days value.
     * @param sender The owner address at the moment of lockPeriodDays changing.
     */
    event LockPeriodSet(uint256 value, address sender);

    /**
     * Emitted when a new base reward principal value is set.
     * @param value A new erc20 token value.
     * @param sender The owner address at the moment of base reward principal changing.
     */
    event BaseRewardPrincipalSet(uint256 value, address sender);

    /**
     * @dev Emitted when a user withdraw interest only.
     * @param sender User address.
     * @param principal The principal of user.
     * @param interest The amount of interest.
     * @param claimTimestamp Claim timestamp.
     */
    event Claimed(
        address indexed sender,
        address indexed nftAddress,
        uint256 nftId,
        uint256 principal,
        uint256 interest,
        uint256 claimTimestamp
    );

    /**
     * Emitted when a user stakes nft token.
     * @param sender User address.
     * @param nftAddress The address of nft.
     * @param nftId The nft id.
     * @param rewardPrincipal Reward principal.
     * @param timestamp The time when staking nft.
     */
    event NftStaked(
        address indexed sender,
        address indexed nftAddress,
        uint256 nftId,
        uint256 rewardPrincipal,
        uint256 timestamp
    );

    /**
     * Emitted when a user unstake nft token.
     * @param sender User address.
     * @param nftAddress The address of nft.
     * @param nftId The nft id.
     * @param rewardAmount The amount of erc20 reward claimed.
     * @param timestamp The time when unstake nft.
     */
    event NftUnstaked(
        address indexed sender,
        address indexed nftAddress,
        uint256 nftId,
        uint256 rewardAmount,
        uint256 timestamp
    );

    // ERC20 about
    // erc20 reward token
    IERC20 public erc20Token;
    // The farming rewards of users(address => total amount)
    mapping(address => uint256) public funding;
    // The total farming rewards for users
    uint256 public totalFunding;

    // ERC721 about
    // base apy
    uint256 public baseApy = 10;
    // Lock Period 365 days
    uint256 public lockPeriodDays = 365 days;
    // base reward principal: 1000 * 10**decimals()
    uint256 public baseRewardPrincipal = 1000 * (10**18);
    // struct NftRewardInfo
    struct NftRewardInfo {
        uint256 baseApy;
        uint256 lockPeriodDays;
        uint256 rewardPrincipal;
        uint256 stakeTime;
        //  Interest already claimed
        uint256 interestClaimed;
    }
    // Mapping (nftAddress => nftId => user address => user reward info)
    mapping(address => mapping(uint256 => mapping(address => NftRewardInfo))) public stakeNftRewardInfo;

    /**
     * @dev Initializes the contract by setting a ERC20 tokenAddress.
     */
    constructor(address tokenAddress_) {
        require(tokenAddress_.isContract(), "must be contract address");
        // init erc20Token
        erc20Token = IERC20(tokenAddress_);
    }

    /**
     * @notice reward fund cannot be less than 0
     * @dev set rewards fund
     * @param amount Reward funds that need to be set
     */
    function fundingContact(uint256 amount) public {
        require(amount > 0, "invalid amount");
        funding[_msgSender()] += amount;
        // increase total funding
        totalFunding += amount;
        // transfer to the address of the initiating contract through erc20
        require(erc20Token.transferFrom(_msgSender(), address(this), amount), "fundingContact: transferFrom failed");
        // send event
        emit ContractFunded(_msgSender(), amount, _now());
    }

    /**
     * Only owner can set base apy.
     *
     * Note: If you want to set apy 10%, just pass 10
     *
     * @param apy annual percentage yield
     */
    function setBaseApy(uint256 apy) public onlyOwner {
        baseApy = apy;
        emit BaseApySet(baseApy, _msgSender());
    }

    /**
     * Only owner can set lock Period.
     *
     * Note: If you want to set 365 days, just pass 365 days
     *
     * @param lockDays lock days
     */
    function setLockPeriod(uint256 lockDays) public onlyOwner {
        lockPeriodDays = lockDays;
        // send event
        emit LockPeriodSet(lockPeriodDays, _msgSender());
    }

    /**
     * Only owner can set reward erc20 token number
     *
     * @param rewardPrincipal Base reward principal.
     */
    function setBaseRewardPrincipal(uint256 rewardPrincipal) public onlyOwner {
        baseRewardPrincipal = rewardPrincipal;
        // send event
        emit BaseRewardPrincipalSet(baseRewardPrincipal, _msgSender());
    }

    function stakeNft(address nftAddress, uint256 tokenId) external whenNotPaused nonReentrant {
        require(nftAddress.isContract(), "stakeNft: must be contract address");

        _stakeNft(_msgSender(), address(this), nftAddress, tokenId);
    }

    // (nftAddress -> nftId -> user address -> user reward info)
    // mapping(address => mapping(uint256 => mapping(address => NftRewardInfo))) stakeNftRewardInfo;
    function _stakeNft(
        address _from,
        address _to,
        address _nftAddress,
        uint256 _tokenId
    ) internal {
        // check nt owner
        require(_getERC721(_nftAddress).ownerOf(_tokenId) == _from, "stakeNft: not owning item");
        // save mapping (nftAddress -> nftId -> user address -> user reward info)
        NftRewardInfo memory _nftRewardInfo = NftRewardInfo(baseApy, lockPeriodDays, baseRewardPrincipal, _now(), 0);
        stakeNftRewardInfo[_nftAddress][_tokenId][_from] = _nftRewardInfo;
        // transfer nft
        _getERC721(_nftAddress).safeTransferFrom(_from, _to, _tokenId);
        // send event
        emit NftStaked(_from, _nftAddress, _tokenId, baseRewardPrincipal, _now());
    }

    function unstakeNft(address nftAddress, uint256 tokenId) external whenNotPaused nonReentrant {
        require(nftAddress.isContract(), "unstakeNft: must be contract address");
        // get user reward info
        NftRewardInfo memory rewardInfo = stakeNftRewardInfo[nftAddress][tokenId][_msgSender()];
        // check if the user have nft staked
        require(rewardInfo.stakeTime > 0, "unstakeNft: don't have nft staked");
        // check lock period
        require(_checkLockPeriod(rewardInfo), "unstakeNft: still within lock period");

        _unstakeNft(nftAddress, tokenId, rewardInfo);
    }

    /**
     * Unstake nft token.
     *
     * @param _nftAddress The address of nft contract.
     * @param _tokenId The nft id.
     */
    function _unstakeNft(
        address _nftAddress,
        uint256 _tokenId,
        NftRewardInfo memory rewardInfo
    ) internal {
        // transfer nft token from current contract
        _getERC721(_nftAddress).safeTransferFrom(address(this), _msgSender(), _tokenId);
        // calculation total interest
        uint256 totalInterest = _calculationInterest(rewardInfo);
        // get erc20 token and interest
        uint256 _amount = totalFunding >= rewardInfo.rewardPrincipal + totalInterest
            ? rewardInfo.rewardPrincipal + totalInterest
            : 0;
        // transfer erc20 token plus interest
        if (_amount > 0) {
            totalFunding -= _amount;
            require(erc20Token.transfer(_msgSender(), _amount), "unstakeNft: transfer failed.");
        }
        delete stakeNftRewardInfo[_nftAddress][_tokenId][_msgSender()];
        // send event
        emit NftUnstaked(_msgSender(), _nftAddress, _tokenId, _amount, _now());
    }

    /**
     * Withdraw the interest only of the user, and update interest claimed.
     */
    function claim(address nftAddress, uint256 tokenId) external whenNotPaused nonReentrant {
        // check contract address
        require(nftAddress.isContract(), "claim: must be contract address");
        // get user reward info
        NftRewardInfo memory rewardInfo = stakeNftRewardInfo[nftAddress][tokenId][_msgSender()];
        // check if user have stake nft
        require(rewardInfo.stakeTime > 0, "claim: don't have nft staked");

        // calculate total interest
        uint256 totalInterest = _calculationInterest(rewardInfo);
        require(totalInterest > 0, "claim: no interest to claim");
        // transfer erc20 token interest
        require(erc20Token.transfer(_msgSender(), totalInterest), "claim: transfer failed");

        rewardInfo.interestClaimed += totalInterest;
        totalFunding -= totalInterest;
        // send event
        emit Claimed(_msgSender(), nftAddress, tokenId, rewardInfo.rewardPrincipal, totalInterest, _now());
    }

    // calculation interest
    function _calculationInterest(NftRewardInfo memory _rewardInfo) internal view returns (uint256) {
        // time interval seconds
        uint256 timeInterval = _now().sub(_rewardInfo.stakeTime);
        uint256 n = timeInterval / 1 days;

        if (n < 1) {
            return 0;
        }

        // get total interest
        uint256 totalWithInterest = Calculator.calculator(_rewardInfo.rewardPrincipal, n, _rewardInfo.baseApy);
        return totalWithInterest - _rewardInfo.interestClaimed;
    }

    // Check if the lockout period has expired
    function _checkLockPeriod(NftRewardInfo memory _ntfRewardInfo) internal view virtual returns (bool) {
        return _now().sub(_ntfRewardInfo.stakeTime) >= _ntfRewardInfo.lockPeriodDays;
    }

    /**
     * Get erc20 token balance by address.
     * @param addr The address of the account that needs to check the balance.
     * @return Return balance of erc20 token.
     */
    function getERC20Balance(address addr) public view returns (uint256) {
        return erc20Token.balanceOf(addr);
    }

    /**
     * Get erc721 token instance by address.
     */
    function _getERC721(address _nftAddress) internal pure returns (IERC721) {
        IERC721 nftContract = IERC721(_nftAddress);
        return nftContract;
    }

    /**
     * Get nft balance by user address and nft id.
     *
     * @param user The address of user.
     * @param nftAddress The address of nft contract.
     */
    function getNftBalance(address user, address nftAddress) public view returns (uint256) {
        return _getERC721(nftAddress).balanceOf(user);
    }

    // withdraw remaining erc20 tokens(only owner)
    function withdraw() public onlyOwner returns (uint256) {
        totalFunding = 0;
        uint256 balance = erc20Token.balanceOf(address(this));
        require(erc20Token.transfer(_msgSender(), balance), "withdraw: transfer failed");
        emit FundingClaimed(_msgSender(), balance, _now());
        return balance;
    }

    /**
     * Pauses all token stake, unstake.
     *
     * See {Pausable-_pause}.
     *
     * Requirements: the caller must be the owner.
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * Unpauses all token stake, unstake.
     *
     * See {Pausable-_unpause}.
     *
     * Requirements: the caller must be the owner.
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @return Returns current timestamp.
     */
    function _now() internal view returns (uint256) {
        return block.timestamp;
    }
}
