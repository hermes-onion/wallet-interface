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
     * First set up broker!
     */
    const broker = await require('./monero-broker').init()
    await broker.startListener()

    /**
     * ...then SocketIO
     */
    io.use(require('./validate-socket-token'))
    io.on('connection', Socket=>{
        clients.push(Socket)

        /**
         * creates a new account
         */
        Socket.on('make-account', async (label = new Date)=>{
            try {
                Socket.emit('make-account-res', {
                    index: await broker.createAccount(label),
                    success: true,
                })
            } catch(e) {
                Socket.emit('make-account-res', {
                    success: false,
                })
            }
        })

        /**
         * get address of account
         */
        Socket.on('get-address-of-account', async account_index=>{
            try {
                Socket.emit('get-address-of-account-res', {
                    success: true,
                    address: await broker.getAccountLastSubAddress(account_index)
                })
            }catch(e){
                console.log(e)
                Socket.emit('get-address-of-account-res', {
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
    })

    // ws server must listen only if no exception has been thrown
    httpServer.listen(process.env.HTTP_PORT, process.env.HTTP_HOST, ()=>{
        console.log(`started listening.. ${process.env.HTTP_HOST}:${process.env.HTTP_PORT}`)
    })

})();

