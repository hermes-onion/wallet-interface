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
                    process.env.WINTER_SECRET
                )
            }

            if(bearer[1] === process.env.WINTER_SECRET) next()
            else throw "bad token"
        } catch(e) {
            console.log(e)
            next(new Error(e))
            socket.disconnect()
        }
    } 
    else {
        next(new Error("bad request"))
        socket.disconnect()
    }
    
}
