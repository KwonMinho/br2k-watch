const Web3 = require('web3');
const { exit } = require('process');
const sr_abi = require(__dirname+'/../res/registry/ServiceRegistry.json');
const GAS = 2000000;
const GAS_PRICE = 1;



module.exports = class ServiceRegistryClient{

    constructor(blockchaincfg){
        this.blockchaincfg = blockchaincfg;
    }

    async init(){
        const blockchain_endpoint = this.blockchaincfg.endpoint;
        const provider = new Web3.providers.WebsocketProvider(blockchain_endpoint)
        const web3Client = new Web3(provider);
        const networkID = await web3Client.eth.net.getId();
        this.registry = new web3Client.eth.Contract(sr_abi.abi, sr_abi.networks[networkID].address);
        this.account = this.blockchaincfg.account;
        this.password = this.blockchaincfg.password;
        this.web3Client = web3Client;
    }

    async updateReplicas(serviceID, replicas){
        const option = this._getOption(true);
        try{
            const result = await this.registry.methods.updateReplicas(serviceID, replicas).send(option);
            return 'success';
        }catch(e){
            console.log(e);
            return e;
        }
    }

    _getOption(isWrite){
        let option = new Object;
        option.from = this.account;
        if(isWrite){
            option.gas = GAS;
            option.gasPrice = GAS_PRICE;
        }
        return option
    }
}