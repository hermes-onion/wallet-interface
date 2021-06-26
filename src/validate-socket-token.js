const {totp} = require('otplib')

totp.options = {
    digits: parseInt(process.env.TOTP_DIGITS),
    step: parseInt(process.env.TOTP_PERIOD),
}

/**
 * Checks the authorization bearer sent by the client
 */
module.exports = (socket, next)=>{
    let auth = socket.request.headers['authorization']

    if(auth){
        try {
            let bearer = auth.split(' ')

            if(process.env.ENV === 'dev') {
                console.log('checking IN|VALID tokens:', 
                    bearer[1], 
                    totp.generate(require('./get-totp-secret')())
                )
            }

            if(totp.check( bearer[1], require('./get-totp-secret')() )) next()
            else next(new Error("bad digits"))
        } catch(e) {
            console.log(e)
            next(new Error("forbidden"))
        }
    } 
    else next(new Error("bad request"))
    
}
