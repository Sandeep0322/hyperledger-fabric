const path = require('path');
const fs = require('fs');

exports.buildCCPOrg1 = function() {
    const ccpPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const fileExists = fs.existsSync(ccpPath);
    if(!fileExists) {
        throw new Error('no such file')
    }
    const contents = fs.readFileSync(ccpPath, 'utf-8');
    const ccp = JSON.parse(contents);
    console.log(`loaded the network at ${ccpPath}`);
    return ccp;
}

exports.buildWallet = async function (Wallets, walletPath) {
    let wallet;
    if (walletPath) {
        wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Build a File system wallet at ${walletPath}`);
    }
    else {
        wallet = await Wallets.newInMemoryWallet();
        console.log('build in memory Wallet');
    }
    return wallet;
}

exports.prettyJSONString = function(inputString) {
    return JSON.stringify(JSON.parse(inputString),null, 2);
}