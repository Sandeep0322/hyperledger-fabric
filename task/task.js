const path = require('path')
const fs = require('fs');

const FabricCAServices = require('fabric-ca-client');
const { Gateway, Wallets } = require('fabric-network');
const walletPath = path.join(__dirname, 'wallet');

const adminUserId = 'admin';
const adminUserPsswd = 'adminpw';

function buildCCPOrg1() {
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

async function buildWallet(Wallets, walletPath) {
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

function prettyJSONString(inputString) {
    return JSON.stringify(JSON.parse(inputString),null, 2);
}

function buildCAClient (FabricCAServices, ccp, caHostName) {
    const caInfo = ccp.certificateAuthorities[caHostName];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts,
    verify: false}, caInfo.caName);

    console.log(`Built a CA Client named ${caInfo.caName}`)
    return caClient;
}

async function enrollAdmin (caClient, wallet, orgMspId) {
    try {
        const identity = await wallet.get(adminUserId);
        if(identity){
            console.log("an Identity for admin user already exists in wallet");
            return
        }

        const enrollment = await caClient.enroll({ enrollmentID: adminUserId,
        enrollmentSecret: adminUserPsswd });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: orgMspId,
            type: 'X.509',
        };
        await wallet.put(adminUserId, x509Identity);
        console.log('successfully enrolled admin user and imported to wallet');

    } catch (error) {
        console.error(`failed to enroll admin user : ${error}`)
    }
}

async function registerAndEnrollUser (caClient, wallet, orgMspId, userId, affiliation) {
    try {
        const userIdentity = await wallet.get(userId);
        if(userIdentity) {
            console.log("user already exists in wallet");
            return
        }
        const adminIdentity = await wallet.get(adminUserId);
        if (!adminIdentity) {
            console.log('admin user does not exists in wallet');
            console.log('enroll the admin user');
            return
        }
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

        const secret = await caClient.register({
            affiliation: affiliation,
            enrollmentID: userId,
            role: 'client'
        },adminUser);
        const enrollment = await caClient.enroll({
            enrollmentID: userId,
            enrollmentSecret: secret
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: orgMspId,
            type: 'X.509',
        };
        console.log(x509Identity);
        await wallet.put(userId, x509Identity);
        console.log(`successfully registered and enrolled user ${userId} and imported in wallet`)

    } catch (error) {
        console.error(`failed to register user : ${error}`)
    }
}

async function getAdmin() {
    let ccp = buildCCPOrg1()

    const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
    const wallet = await buildWallet(Wallets, walletPath);
    await enrollAdmin(caClient, wallet, 'Org1MSP');
}

async function getUser (org1UserId) {
    let ccp = buildCCPOrg1()

    const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
    const wallet = await buildWallet(Wallets, walletPath);
    await registerAndEnrollUser(caClient, wallet, 'Org1MSP', org1UserId, 'org1.department1')
}

const org1UserId = 'sandeep';
const channelName = 'mychannel';
const chaincodeName = 'basic';

async function main () {
    try {
        let args = process.argv
        if(args[2] === 'admin'){
            getAdmin()
        }
        else if( args[2] === 'user') {
            let org1UserId = args[3]
            getUser(org1UserId)
        }
        else if(args[2] === 'GetAllDocuments'){
            const ccp = buildCCPOrg1();
            const wallet =await buildWallet(Wallets, walletPath);
            const gateway = new Gateway();
            await gateway.connect(ccp, {
                wallet,
                identity: org1UserId,
                discovery: {enabled: true, asLocalhost: true}
            })
            const network = await gateway.getNetwork(channelName);
            const contract = network.getContract(chaincodeName);
            let result = await contract.evaluateTransaction('GetAllDocuments');
            console.log(`${prettyJSONString(result.toString())}`)
            gateway.disconnect();
        }
        else if(args[2] === 'ReadDocument'){
            const ccp = buildCCPOrg1();
            const wallet =await buildWallet(Wallets, walletPath);
            const gateway = new Gateway();
            await gateway.connect(ccp, {
                wallet,
                identity: org1UserId,
                discovery: {enabled: true, asLocalhost: true}
            })
            const network = await gateway.getNetwork(channelName);
            const contract = network.getContract(chaincodeName);
            let asset = args[3]
            result = await contract.evaluateTransaction('ReadDocument', asset);
            console.log(`${prettyJSONString(result.toString())}`)
            gateway.disconnect();
            
        }
        else if (args[2] === 'CreateDocument'){
            const ccp = buildCCPOrg1();
            const wallet =await buildWallet(Wallets, walletPath);
            const gateway = new Gateway();
            await gateway.connect(ccp, {
                wallet,
                identity: org1UserId,
                discovery: {enabled: true, asLocalhost: true}
            })
            const network = await gateway.getNetwork(channelName);
            const contract = network.getContract(chaincodeName);
            let r = await contract.submitTransaction('CreateDocument', 'pdf', 'doc2', 5, 'qwer', '')
            console.log('result',r.toString())
            gateway.disconnect();
        }
        else if (args[2] === 'TransferDocument'){
            const ccp = buildCCPOrg1();
            const wallet =await buildWallet(Wallets, walletPath);
            const gateway = new Gateway();
            await gateway.connect(ccp, {
                wallet,
                identity: org1UserId,
                discovery: {enabled: true, asLocalhost: true}
            })
            const network = await gateway.getNetwork(channelName);
            const contract = network.getContract(chaincodeName);
            let r = await contract.submitTransaction('TransferDocument', 'doc1', 'sandeep')
            console.log('result',r.toString())
            gateway.disconnect();
        }
        else{
            console.log('......')
        }
    } catch (error) {
        throw new Error(error)
    }
}

main();