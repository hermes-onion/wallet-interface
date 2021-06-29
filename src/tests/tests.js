require('dotenv').config({
    'path': `${__dirname}/../../.env`
});

(async ()=>{
    try {

    const MoneroBroker = require('../monero-broker')
    const broker = new MoneroBroker({
        url: 'http://127.0.0.1:8885',
        username: 'admin',
        password: 'admin',
    })

    console.log( await broker.openWallet('testnet', require('../get-wallet-password')()) )

    //console.log( await broker.createAccount() )
    //const acc = await broker.createAccount()

    //console.log( await broker.createAddress(2))

    //console.log( await broker.getAccounts())
    //console.log( await broker.getAddress(acc.account_index, []))
    //console.log( await broker.getAddressBook([0, 1]))
    console.log( await broker.getTransferByTxid('bc35902057c5dc0ecbc3bc9afaeaa48d8fa6eb4259685cfacccb30b9ef1a8380'))
    } catch(e) {
        console.log(e)
    }
})();

