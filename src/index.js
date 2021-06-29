require('dotenv').config()

const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
    cors: { origin: "*" },
});

const clients = require('./socket-clients');

(async ()=>{

    /* generic wallet rpc startup: 

    monero-wallet-rpc --daemon-host testnet.community.xmr.to \
                    --testnet --trusted-daemon \
                    --rpc-bind-port 8885 --rpc-login admin:admin \
                    --wallet-dir ./
    */

    /**
     * First set up Broker!
     */
    const MoneroBroker = require('./monero-broker')
    const Broker = new MoneroBroker({
        url: process.env.ENV === "dev" ? 
            process.env.RPC_SCHEME_TESTNET : 
            process.env.RPC_SCHEME_MAINNET
    })
    await Broker.openWallet(
        process.env.ENV === "dev" ? "testnet" : "mainnet",
        require('./get-wallet-password')(),    
    )

    /**
     * ...then SocketIO
     */
    io.use(require('./validate-socket-token'))
    io.on('connection', Socket=>{
        clients.push(Socket)

        /**
         * creates a new account
         * 
         * json: { label, rid (request ID) }
         */
        Socket.on('make-account', async (json)=>{
            try {
                Socket.emit(`make-account-res-${json.rid}`, {
                    account: await Broker.createAccount(json.label),
                    success: true,
                })
            } catch(e) {
                Socket.emit(`make-account-res-${json.rid}`, {
                    success: false,
                })
            }
        })

        /**
         * retrieves the address of an account
         * 
         * json: { label, rid (request ID) }
         */
        Socket.on('get-account-address', async json=>{
            try {
                Socket.emit(`get-account-address-res-${json.rid}`, {
                    address: (await Broker.getAddress(json.account_index, [0])).address,
                    success: true,
                })
            } catch(e) {
                Socket.emit(`get-account-address-res-${json.rid}`, {
                    success: false,
                })
            }
        })

        // remove from list on disconnect
        Socket.on('disconnect', ()=>{
            clients.forEach((item, index)=>{
                if(item === Socket) {
                    clients.splice(index, 1)
                }
            })
        })
    });

    // tx notify receiver
    require('./tx-notify-responder')(Broker);

    // ws server must listen only if no exception has been thrown
    httpServer.listen(process.env.HTTP_PORT, process.env.HTTP_HOST, ()=>{
        console.log(`started listening.. ${process.env.HTTP_HOST}:${process.env.HTTP_PORT}`)
    });

})();

