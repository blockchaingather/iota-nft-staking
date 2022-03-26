// SPDX-License-Identifier: MITx
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title IotaERC721
 *
 */
contract IotaERC721 is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _counter;
    string public prefixUri;
    mapping(uint256 => string) _ipfsHashMap;

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        prefixUri = "https://ipfs.io/ipfs/";
    }

    function mint(string memory ipfsHash_) public onlyOwner returns (uint256) {
        _counter.increment();
        uint256 tokenId = _counter.current();
        _ipfsHashMap[tokenId] = ipfsHash_;
        _safeMint(msg.sender, tokenId);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721: operator query for nonexistent token");
        return bytes(prefixUri).length > 0 ? string(abi.encodePacked(prefixUri, _ipfsHashMap[tokenId])) : "";
    }

    function setBaseURI(string memory uri_) public onlyOwner {
        prefixUri = uri_;
    }

    function burn(uint256 tokenId) public virtual {
        require(_isApprovedOrOwner(msg.sender, tokenId), "You are not the owner nor approval.");
        _burn(tokenId);
    }
}
