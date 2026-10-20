// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Gold13 is ERC20 {
    constructor() ERC20("Gold13", "MTK") {
        _mint(msg.sender, 10000 * 10 ** decimals());
    }
}
