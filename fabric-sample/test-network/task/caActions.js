const path = require('path')
const helper = require('./helper');

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');

const adminUserId = 'admin';
const adminUserPsswd = 'adminpw';

const walletPath = path.join(__dirname, 'wallet');

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
    let ccp = helper.buildCCPOrg1()

    const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
    const wallet = await helper.buildWallet(Wallets, walletPath);
    await enrollAdmin(caClient, wallet, 'Org1MSP');
}

async function getUser (org1UserId) {
    let ccp = helper.buildCCPOrg1()

    const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
    const wallet = await helper.buildWallet(Wallets, walletPath);
    await registerAndEnrollUser(caClient, wallet, 'Org1MSP', org1UserId, 'org1.department1')
}

let args = process.argv

if(args[2] === 'admin'){
    getAdmin()
}
else if( args[2] === 'user') {
    let org1UserId = args[3]
    getUser(org1UserId)
}else {
    console.log('.....')
}