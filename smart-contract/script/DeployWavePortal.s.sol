// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {WavePortal} from "../src/WavePortal.sol";

contract DeployWavePortal is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        WavePortal wavePortal = new WavePortal();
        console.log("WavePortal deployed to:", address(wavePortal));

        vm.stopBroadcast();
    }
}