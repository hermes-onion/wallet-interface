require('dotenv').config({
    'path': `${__dirname}/../../.env`
})

const {totp} = require('otplib');
totp.options = {    
    digits: parseInt(process.env.TOTP_DIGITS),
    period: parseInt(process.env.TOTP_PERIOD),
}

let token = totp.generate(require('../get-totp-secret')())

/**
 * make sure server is started first
 */
setTimeout(()=>{


const Conn = require("socket.io-client")
    (`http://${process.env.HTTP_HOST}:${process.env.HTTP_PORT}`, {
        extraHeaders: {
            authorization: `Bearer ${token}`
        }
    })

Conn.on('connect', ()=>{
    setTimeout(()=>{
        Conn.emit('make-account', 'some acc label')

    }, 1000)
})

Conn.on('$error', data=>console.log(data))
Conn.on('make-account-res', json=> {
    console.log(json)

    Conn.emit('get-address-of-account', json.index)
} )
Conn.on('tx-confirmed', json=>console.log(json))
Conn.on('get-address-of-account-res', json=>console.log(json))    



},1000);



