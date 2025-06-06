// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title SimpleStorage
 * @dev Store & retrieve a value
 */
contract SimpleStorage {
    uint256 private value;
    address private owner;
    
    event ValueChanged(uint256 newValue);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    /**
     * @dev Store value in variable
     * @param newValue value to store
     */
    function store(uint256 newValue) public onlyOwner {
        value = newValue;
        emit ValueChanged(newValue);
    }

    /**
     * @dev Return value 
     * @return the stored value
     */
    function retrieve() public view returns (uint256) {
        return value;
    }
    
    /**
     * @dev Return the contract owner
     * @return the owner address
     */
    function getOwner() public view returns (address) {
        return owner;
    }
}
