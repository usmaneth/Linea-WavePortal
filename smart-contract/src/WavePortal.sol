// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// No need to import WavePortal as it's being defined in this file

contract WavePortal {
    struct Wave {
        address waver;
        string message;
        uint256 timestamp;
    }

    Wave[] public waves;
    uint256 public totalWaves;

    event NewWave(address indexed from, uint256 timestamp, string message);

    function wave(string memory _message) public {
        totalWaves += 1;
        waves.push(Wave(msg.sender, _message, block.timestamp));
        emit NewWave(msg.sender, block.timestamp, _message);
    }

    function getAllWaves() public view returns (Wave[] memory) {
        return waves;
    }

    function getTotalWaves() public view returns (uint256) {
        return totalWaves;
    }
}