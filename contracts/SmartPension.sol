// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SmartPension {
    // Struct to store pensioner information
    struct Pensioner {
        address wallet;
        string name;
        uint256 pensionAmount;
        uint256 lastVerificationDate;
        bool isActive;
        bool isDeceased;
    }

    // State variables
    address public owner;
    uint256 public totalPensioners;
    uint256 public verificationPeriod = 180 days; // 6 months

    // Mapping from pensioner ID to Pensioner struct
    mapping(uint256 => Pensioner) public pensioners;
    // Mapping from address to pensioner ID
    mapping(address => uint256) public addressToPensionerID;

    // Events
    event PensionerRegistered(uint256 indexed pensionerID, address indexed wallet, string name);
    event VerificationCompleted(uint256 indexed pensionerID, uint256 timestamp);
    event PensionerDeceased(uint256 indexed pensionerID, uint256 timestamp);
    event PaymentBlocked(uint256 indexed pensionerID, uint256 timestamp);
    event PaymentUnblocked(uint256 indexed pensionerID, uint256 timestamp);

    // Constructor
    constructor() {
        owner = msg.sender;
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyActivePensioner(uint256 _pensionerID) {
        require(pensioners[_pensionerID].isActive, "Pensioner is not active");
        require(!pensioners[_pensionerID].isDeceased, "Pensioner is deceased");
        _;
    }

    // Function to register a new pensioner
    function registerPensioner(
        address _wallet,
        string memory _name,
        uint256 _pensionAmount
    ) public onlyOwner returns (uint256) {
        require(_wallet != address(0), "Invalid wallet address");
        require(addressToPensionerID[_wallet] == 0, "Wallet already registered");
        
        totalPensioners++;
        uint256 pensionerID = totalPensioners;
        
        pensioners[pensionerID] = Pensioner({
            wallet: _wallet,
            name: _name,
            pensionAmount: _pensionAmount,
            lastVerificationDate: block.timestamp,
            isActive: true,
            isDeceased: false
        });
        
        addressToPensionerID[_wallet] = pensionerID;
        
        emit PensionerRegistered(pensionerID, _wallet, _name);
        return pensionerID;
    }

    // Function to verify a pensioner is alive
    function verifyPensioner(uint256 _pensionerID) public onlyActivePensioner(_pensionerID) {
        pensioners[_pensionerID].lastVerificationDate = block.timestamp;
        emit VerificationCompleted(_pensionerID, block.timestamp);
    }

    // Function to register a death
    function registerDeath(uint256 _pensionerID) public onlyOwner {
        require(!pensioners[_pensionerID].isDeceased, "Pensioner already marked as deceased");
        require(pensioners[_pensionerID].isActive, "Pensioner is not active");
        
        pensioners[_pensionerID].isDeceased = true;
        pensioners[_pensionerID].isActive = false;
        
        emit PensionerDeceased(_pensionerID, block.timestamp);
    }

    // Function to check if pensioner's payments should be blocked
    function shouldBlockPayment(uint256 _pensionerID) public view returns (bool) {
        if (pensioners[_pensionerID].isDeceased) {
            return true;
        }
        
        if (!pensioners[_pensionerID].isActive) {
            return true;
        }
        
        return (block.timestamp - pensioners[_pensionerID].lastVerificationDate) > verificationPeriod;
    }

    // Function to block payments for a pensioner
    function blockPayments(uint256 _pensionerID) public onlyOwner {
        require(pensioners[_pensionerID].isActive, "Pensioner is not active or already blocked");
        pensioners[_pensionerID].isActive = false;
        emit PaymentBlocked(_pensionerID, block.timestamp);
    }

    // Function to unblock payments for a pensioner
    function unblockPayments(uint256 _pensionerID) public onlyOwner {
        require(!pensioners[_pensionerID].isActive, "Pensioner is already active");
        require(!pensioners[_pensionerID].isDeceased, "Cannot unblock deceased pensioner");
        
        pensioners[_pensionerID].isActive = true;
        emit PaymentUnblocked(_pensionerID, block.timestamp);
    }

    // Function to get pensioner information
    function getPensioner(uint256 _pensionerID) public view returns (
        address wallet,
        string memory name,
        uint256 pensionAmount,
        uint256 lastVerificationDate,
        bool isActive,
        bool isDeceased
    ) {
        Pensioner memory p = pensioners[_pensionerID];
        return (p.wallet, p.name, p.pensionAmount, p.lastVerificationDate, p.isActive, p.isDeceased);
    }

    // Function to get pensioner ID by address
    function getPensionerIDByAddress(address _wallet) public view returns (uint256) {
        require(addressToPensionerID[_wallet] != 0, "Address not registered");
        return addressToPensionerID[_wallet];
    }

    // Function to update verification period
    function setVerificationPeriod(uint256 _days) public onlyOwner {
        verificationPeriod = _days * 1 days;
    }
} 