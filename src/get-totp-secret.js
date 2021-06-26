/**
 * 
 * dotenv.config() must be called upfront!
 * Retrieves the TOTP token from .env
 * 
 * @returns {Buffer}
 */
module.exports = ()=>{
    return Buffer.from(
        process.env.TOTP_SECRET,
        'base64'
    )
}