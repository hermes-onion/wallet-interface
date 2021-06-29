const zmq = require("zeromq")


/**
 * 
 * @param {object} Broker 
 */
async function run(Broker) {
  const sock = new zmq.Reply

  await sock.bind(`tcp://127.0.0.1:${process.env.TX_NOTIFY_RESPONDER_PORT}`)
  console.log(`tx-notify-responder bound to ${process.env.TX_NOTIFY_RESPONDER_PORT}`)

  // listen for requests...
  for await (const [msg] of sock) {	

    // retrieve transaction
    Broker.getTransferByTxid(msg.toString().trim())
    .then(async res=>{
      const TX = res.transfer

      // emit tx only if it'd been confirmed
      if(TX.type === 'in' && TX.confirmations > 0) {
        const newFundingAddress = await Broker.createAddress(TX.subaddr_index.major)

        require('./socket-clients').forEach(Client=>{
            const json_data = {
              'account-index': TX.subaddr_index.major,
              'new-funding-address': newFundingAddress,
              balance: TX.amount,
              txId: TX.txid,
            }

            Client.emit('tx-confirmed', json_data)

            console.log('data emitted', json_data)
        })     
      }
    })
    .catch(err=>console.log('error:', err))

    // release buffer asap!
    sock.send(`ok`)
    .then(res=>console.log('sent!', res))
    .catch(err=>console.log('error:', err))
  }
}

module.exports = run
