import Web3 from 'web3'
import ETH_SR_ABI from './eth-ServiceRegistry.json'

const endpoint = 'ws://203.250.77.150:8546';


let ScvRegClient = {
    registry: null,

    initEthServiceRegistry: async function(){
        const provider = new Web3.providers.WebsocketProvider(endpoint);
        const web3Client = new Web3(provider);
        const networkID = await web3Client.eth.net.getId();
        this.registry = new web3Client.eth.Contract(
            ETH_SR_ABI.abi, ETH_SR_ABI.networks[networkID].address);
    },


    async getServices(account){
        const option = this._getOptionEth(account, false);
        let serviceList = [];

        try{
            const serviceNames = await this.registry.methods.getServiceList().call(option);
            for(let i=0; i< serviceNames.length; i++){
                const curServiceID = serviceNames[i];
                const service = await this.registry.methods.getService(curServiceID).call(option);
                
                let location;
                if(service.state == 2){
                    location = await this.registry.methods.getServiceLocation(curServiceID).call(option);
                }

                serviceList.push({
                    name: curServiceID,
                    header: this._makeHeader(service.header),
                    backup: this._makeBackUp(service.backup),
                    context: this._makeContext(service.runtime[1]),
                    imageInfo: this._makeImageInfo(service.runtime[0]),
                    state: this._getState(service.state),
                    curReplicas: service.curReplicas,
                    curServiceLocation: this._getServiceLocation(location),
                    serviceStartTime: this._timeConverter(service.serviceStartTime),
                    serviceEndTime: this._timeConverter(service.serviceEndTime),
                    curAPIServer: service.runtime[1][0][0],
                    isViewDeployState: 0,
                    isRecentlyRead: false,
                    isMouseOver: false
                })
            }
            return serviceList;
        }catch(e){  
            console.log(e);
            return serviceList;
        }
    },

    _timeConverter(timestamp){
        if(timestamp==0) return ''
        const a = new Date(timestamp * 1000);
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const time = a.getDate()+' '+months[a.getMonth()]+' '+a.getFullYear() +" "
                     +a.getHours()+':'+a.getMinutes()+":"+a.getSeconds();
        return time;
    },

    _getServiceLocation(location){
        if(location == null) return ''
        return location['serviceProtocol']+"://"+location['servicePoint']+":"+location['servicePort'];
    },

    _getState: function(stateIndex){
        if(stateIndex == 1) return "Not start service"
        if(stateIndex == 2) return "Service Running"
        if(stateIndex == 3) return "Service Stop"
    },

    _makeImageInfo: function(struct){
        return{
            image: struct[0],
            accessUser: struct[1]
        }
    },

    _makeHeader: function(struct){
        return{
            id: struct[0],
            manager: struct[1],
            serviceAccount: struct[2],
            name: struct[3],
            email: struct[4],
            contact: struct[5],
            desc: struct[6]
        }
    },

    _makeBackUp: function(struct){
        return {
            cnt: struct[0],
            snapshots: struct[1],
            states: struct[2]
        }
    },

    _makeContext: function(struct){
        return {
            location: struct[0],
            accessToken: struct[1],
            nodeID: struct[2],
            networkID: struct[3],
            serviceProtocol: struct[4],
            servicePoints: struct[5],
            servicePort: struct[6],
            nodeMountScv: struct[7],
            nodeMountETCD: struct[8],
            secret: struct[9]
        }
    },

    _getOptionEth: function(account, isWrite){
        let option = {};
        option.from = account;
        if(isWrite){
            option.gas = 2000000;
            option.gasPrice = 1;
        }
        return option;
    },
}

export {ScvRegClient}