/**
 * dotenv.config() must be called upfront!
 * Retrieves wallet's password
 * 
 * @returns {string}
 */
module.exports = ()=>{
    return Buffer.from(
        process.env.WALLET_PASSWORD,
        'base64'
    ).toString()
}