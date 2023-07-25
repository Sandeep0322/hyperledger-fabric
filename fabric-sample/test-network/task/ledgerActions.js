const path = require('path')

const { Gateway, Wallets } = require('fabric-network');
const walletPath = path.join(__dirname, 'wallet');

const org1UserId = 'sandeep';
const channelName = 'mychannel';
const chaincodeName = 'basic';

async function main () {
    try {
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

        let args = process.argv
        
        if(args[2] === 'GetAllDocuments'){
            let result = await contract.evaluateTransaction('GetAllDocuments');
            console.log(`${prettyJSONString(result.toString())}`)
        }
        else if(args[2] === 'ReadDocument'){
            let asset = args[3]
            result = await contract.evaluateTransaction('ReadDocument', asset);
            console.log(`${prettyJSONString(result.toString())}`)
            
        }
        else if (args[2] === 'CreateDocument'){
            let r = await contract.submitTransaction('CreateDocument', 'pdf', 'doc2', 5, 'qwer', '')
            console.log('result',r.toString())
        }
        else if (args[2] === 'TransferDocument'){
            let r = await contract.submitTransaction('TransferDocument', 'doc1', 'sandeep')
            console.log('result',r.toString())
        }
        else{
            console.log('......')
        }
        gateway.disconnect();
    } catch (error) {
        throw new Error(error)
    }
}

main();