const Axios = require('axios')

/**
 * Interacts with wallet-rpc
 */
class MoneroBroker {
    /**
     * @param {object} config
     */
    constructor(config){
        this._config = config
    }

    /**
     * Send commands to wallet rpc process
     * 
     * @param {string} method 
     * @param {object} params 
     * @returns {Promise} Promise
     */
    send(method, params){

        return new Promise((accept, reject)=>{
            Axios.post(
                `${this._config.url}/json_rpc`, 
                {
                    id: "0",
                    jsonrpc: "2.0",
                    method,
                    params,
                }
            ).then(response=>{
                if(response.data.error) reject(response.data.error)
                else accept(response.data.result)
            }).catch(error=> reject(error))
        })
    }

    /**
     * Opens a wallet
     * 
     * @param {string} filename
     * @param {string} password
     */
    openWallet(filename, password){
        return new Promise((accept, reject)=>{
            this.send("open_wallet", {filename, password})
            .then(res=>accept(res))
            .catch(err=>reject(err))
        })
    }

    /**
     * Create a new account
     * 
     * @param {string} label 
     * @returns {Promise}
     */
    createAccount(label = undefined){
        return new Promise((accept, reject)=>{
            this.send("create_account", {label})
            .then(res=>accept(res))
            .catch(err=>reject(err))
        })
    }

    /**
     * Creates a new address for an account located by its index
     * 
     * @param {int} account_index 
     * @param {string} label 
     * @returns {Promise}
     */
    createAddress(account_index, label = undefined) {
        return new Promise((accept, reject)=>{
            this.send("create_address", {account_index, label})
            .then(res=>accept(res))
            .catch(err=>reject(err))
        })
    }

    /**
     * Returns all accounts and filters them based on tags
     * 
     * @param {string} tag 
     * @returns {Promise}
     */
     getAccounts(tag = undefined){
        return new Promise((accept, reject)=>{
            this.send("get_accounts", {tag})
            .then(res=>accept(res))
            .catch(err=>reject(err))
        })
    }

    /**
     * Retrieves transfer information by its ID
     * 
     * @param {string} txid 
     * @param {int} account_index
     * @returns {Promise}
     */
    async getTransferByTxid(txid, account_index = undefined){
        if(account_index) {
            return await this.send("get_transfer_by_txid", { txid, account_index })
        }

        const accounts = await this.getAccounts()

        // iterate accounts
        for (const acc of accounts.subaddress_accounts) {
            try {
                return await this.send("get_transfer_by_txid", {
                    txid, 
                    account_index: acc.account_index,
                })
            } catch(e) {
                if(e.code === -8) continue
            }
        }

        // should not be reached
        throw {code: -8, message: 'tx not found'}
    }

    /**
     * Return the wallet's addresses for an account. Optionally filter for specific set of subaddresses.
     * 
     * @param {int} account_index 
     * @param {int[]} address_index 
     * @returns {Promise}
     */
    getAddress(account_index, address_index = [])
    {
        return new Promise((accept, reject)=>{
            this.send("get_address", {account_index, address_index})
            .then(res=>accept(res))
            .catch(err=>reject(err))
        })
    }

    /**
     * Retrieves entries from the address book
     * 
     * @param {array} entries 
     * @returns {Promise}
     */
    getAddressBook(entries){
        return new Promise((accept, reject)=>{
            this.send("get_address_book", {entries})
            .then(res=>accept(res))
            .catch(err=>reject(err))
        })
    }
}

module.exports = MoneroBroker