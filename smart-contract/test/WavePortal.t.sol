// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/WavePortal.sol";
import {WavePortal} from "../src/WavePortal.sol";

contract WavePortalTest is Test {
    WavePortal public wavePortal;
    address alice = address(0x1);
    address bob = address(0x2);

    function setUp() public {
        wavePortal = new WavePortal();
    }

    function testWave() public {
        vm.prank(alice);
        wavePortal.wave("Hello, Linea!");

        assertEq(wavePortal.getTotalWaves(), 1);
        
        (address waver, string memory message, ) = wavePortal.waves(0);
        assertEq(waver, alice);
        assertEq(message, "Hello, Linea!");
    }

    function testMultipleWaves() public {
        vm.prank(alice);
        wavePortal.wave("Wave from Alice");

        vm.prank(bob);
        wavePortal.wave("Wave from Bob");

        vm.prank(alice);
        wavePortal.wave("Another wave from Alice");

        assertEq(wavePortal.getTotalWaves(), 3);

        WavePortal.Wave[] memory allWaves = wavePortal.getAllWaves();
        assertEq(allWaves.length, 3);
        assertEq(allWaves[0].waver, alice);
        assertEq(allWaves[0].message, "Wave from Alice");
        assertEq(allWaves[1].waver, bob);
        assertEq(allWaves[1].message, "Wave from Bob");
        assertEq(allWaves[2].waver, alice);
        assertEq(allWaves[2].message, "Another wave from Alice");
    }

    function testGetTotalWaves() public {
        assertEq(wavePortal.getTotalWaves(), 0);

        vm.prank(alice);
        wavePortal.wave("First wave");

        assertEq(wavePortal.getTotalWaves(), 1);

        vm.prank(bob);
        wavePortal.wave("Second wave");

        assertEq(wavePortal.getTotalWaves(), 2);
    }
}