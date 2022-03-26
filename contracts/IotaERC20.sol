// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract IotaERC20 is ERC20 {
    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     * total supply 1 billion
     */
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _mint(msg.sender, 1000000000 * 10**decimals());
    }
}
