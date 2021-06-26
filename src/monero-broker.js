const {connectToWalletRpc, LibraryUtils, MoneroWallet, MoneroWalletListener, createWalletFull} = require('monero-javascript');
const MoneroDaemonRpc = require('monero-javascript/src/main/js/daemon/MoneroDaemonRpc');
const {homedir} = require('os')
const { onShutdown } = require( "node-graceful-shutdown" )

/**
 * Creates a wallet based on application env.
 * 'mainnet' for production, 'testnet' for development.
 * 
 * Should be used if there is no wallet
 */
const createWallet = async ()=>{
    await createWalletFull({
        path: `${homedir()}/monero/${process.env.ENV === 'prod' ? 'mainnet' : 'testnet'}`,
        password: require('./get-wallet-password')(),
        networkType: process.env.ENV === 'prod' ? 'mainnet' : 'testnet',
    });
}


/**
 * Broker between monero-cli and app runtime
 */
module.exports = class {
    /**
     * Factory.
     * Exceptions MUST crash the runtime
     * 
     * @returns {self} instance
     */
    static async init(){
        // configures log level
        if(process.env.ENV !== 'prod')
            await LibraryUtils.setLogLevel(10)

        let daemon = await connectToWalletRpc(
            process.env.RPC_SCHEME, 
            process.env.RPC_USR, 
            process.env.RPC_PSS
        );
        
        await daemon.openWallet(
            process.env.ENV === 'prod' ? 'mainnet' : 'testnet', 
            require('./get-wallet-password')()
        );

        console.log('wallet opened with success! sync in progress..')

        await daemon.sync(parseInt(process.env.WALLET_START_SYNC))

        console.log('sync done.')

        // safely close wallet
        onShutdown('monero-wallet', async ()=>{
            console.log('closing wallet...')
            await daemon.closeWallet()
        })

        return new this(daemon)
    }

    /**
     * Starts wallet related events.
     * Amid exception it must crash the runtime.
     * 
     * @returns {void}
     */
    async startListener(){
        let broker = this

        await this._daemon.addListener(new class extends MoneroWalletListener {
          async onOutputReceived(Out) {
              
            let TX = Out.getTx()

            if(process.env.DEV === 'dev') console.log('output received: ', Out)

            // if tx is confirmed broadcast this info to socket clients
            if(TX.isConfirmed() && TX.isLocked()) {

                if(process.env.DEV === 'dev') 
                    console.log('output TX is confirmed and locked (ready to broadcast): ', TX.getHash())

                let accIndex = Out.getAccountIndex()

                await broker._daemon.createSubaddress(accIndex)

                require('./socket-clients').forEach(Client=>{
                    Client.emit('tx-confirmed', {
                        'account-index': accIndex,
                        balance: Out.getAmount(),
                        txId: TX.getHash(),
                    })
                })     
            }
          }
        });
    }

    /**
     * Takes daemon as parameter
     * 
     * @param {MoneroDaemonRpc} daemon instance
     */
    constructor(daemon){
        this._daemon = daemon
    }

    /**
     * Creates a new account and returns its index
     * 
     * @param {string} label defaults to current Date
     * @returns {int} account index 
     */
    async createAccount(label = new Date){
        let acc = await this._daemon.createAccount(label)

        return acc.getIndex()
    }

    /**
     * Retrieves account's primary address
     * 
     * @param {int} account_index 
     * @returns {string}
     */
    async getAccountAddress(account_index){
        const accounts = await this._daemon.getAccounts()

        for(const Acc of accounts){
            if(Acc.getIndex() === account_index)
                return await Acc.getPrimaryAddress()            
        }


        throw new Error('account does not exist')
    }

    /**
     * Retrieves account's last sub-address
     * 
     * @param {int} account_index 
     * @returns {string}
     */
    async getAccountLastSubAddress(account_index){
        const accounts = await this._daemon.getAccounts(true)

        for(const Acc of accounts){
            if(Acc.getIndex() === account_index){
                let addresses = Acc.getSubaddresses()
                
                return addresses[addresses.length-1].getAddress()
            }
                
        }

        throw new Error('account does not exist')
    }
}
