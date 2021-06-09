import Vuex from 'vuex'
import Vue from 'vue'
import { ScvRegClient } from "./service-registry-client";
import { K8sClient } from "./k8s-client";
import axios from 'axios';


const modifyServer = 'http://localhost:6767';
const scvRegEndpoint = 'ws://203.250.77.150:8546';


Vue.use(Vuex)

const store = new Vuex.Store({

    //this.$store.state.serviceList
    state:{
        serviceList: [],
        isUserLogin: false,
        user: {
            account: null,
            password: null,
            ca: null,
            cert: null,
            key: null
        },
        curReadLog: '',
        curDetailScvIndex: -1,
        curSettingScvIndex: -1,
        curIsUpdating: false,
    },

    // trigger state change --> store.commit('increment')
    mutations:{
        async addReplicas(self, payload){
            const curIndex = payload.curScvIndex;
            const updateNumber = payload.updateNumber;
            const msg = await askUpdateReplicas('add', updateNumber, curIndex);
            if(msg == 'success'){
                await readAllService();
                await readState(curIndex);
            }
            this.state.curSettingScvIndex = -1;
            this.state.curIsUpdating = false;
        },
        async reduceReplicas(self, payload){
            const curIndex = payload.curScvIndex;
            const updateNumber = payload.updateNumber;
            console.log(this.state.serviceList[curIndex])
            console.log(updateNumber)
            const msg = await askUpdateReplicas('reduce', updateNumber, curIndex);
            if(msg == 'success'){
              await readAllService();
              await readState(curIndex);
            }
            this.state.curSettingScvIndex = -1;
            this.state.curIsUpdating = false;
        }, 
        async recoveryReplicas(self, payload){
            const curIndex = payload.curScvIndex;
            const failedList = payload.failedList;
            console.log('@@@@@@@@@@@@@2');
            const msg = await askUpdateReplicas('recovery', '', curIndex);
            console.log(msg)
            if(msg == 'success'){
              await readAllService();
              await readState(curIndex);
            }
            this.state.curSettingScvIndex = -1;
            this.state.curIsUpdating = false;
        },
        async readLogStream(self, payload){
            const scvName = payload.scvName;
            const curScvIndex = payload.curScvIndex;
            const podName = payload.podName;
            const curAPIServer = this.state.serviceList[curScvIndex].curAPIServer
            await getReadLogStream(scvName, curAPIServer, podName);
        },
        changeAppSetting(self, scvName){
            this.state.serviceList.forEach((scv,index) => {
                if(scv.name == scvName){
                    this.state.curSettingScvIndex = index;
                }
            });
        },
        changeDetailService(self, scvName){
            this.state.serviceList.forEach((scv,index) => {
                if(scv.name == scvName){
                    this.state.curDetailScvIndex = index;
                }
            });
        },
        async refreshState(self, payload){
            const index = payload.index;
            this.state.serviceList[index].curAPIServer = payload.curAPIServer;
            await readState(index);
        },
        completedStateNotify(self, index){
            this.state.serviceList[index].isRecentlyRead=false;
        },
        async login(self, payload){
            this.state.isUserLogin= true;
            this.state.user = payload;
            await readAllService();
            await setClientK8s();
            await readAllState();
        },
        logout(){
            this.state.serviceList = [],
            this.state.isUserLogin = false,
            this.state.user = {
                account: null,
                password: null,
                ca: null,
                cert: null,
                key: null
            }
        }
    },
})

async function init(){
    await ScvRegClient.initEthServiceRegistry();
}


async function askUpdateReplicas(type, updateNumber, scvIndex){
    try{
        store.state.curIsUpdating = true;
        const res = await axios({
            url: `/replicas`,
            method: "post",
            baseURL: modifyServer,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            },
            data: {
                type: type,
                updateNumber: updateNumber,
                service: store.state.serviceList[scvIndex],
                registryInfo:{
                    account: store.state.user.account,
                    password: store.state.user.password,
                    endpoint: scvRegEndpoint
                }
            }
          })
        return res.data;
    }catch(e){
        store.state.curIsUpdating = false;
        return 'falied';
    }
}

function setClientK8s(){
    store.state.serviceList.forEach((service)=>{
        K8sClient.setClient(service.name, service.context.accessToken, service.context.location);
    });
}

async function getReadLogStream(scvName, curAPIServer, podName){
   store.state.curReadLog = 'Loading.......'
   let readLog =  await K8sClient.getReadLogStream(scvName, curAPIServer, podName);
   store.state.curReadLog = readLog;
}

async function readAllService(){
    const account = store.state.user.account;
    store.state.serviceList= await ScvRegClient.getServices(account);
}

async function readState(index){
    const target = store.state.serviceList[index].name;
    const curAPIServer = store.state.serviceList[index].curAPIServer;

    const result = await K8sClient.readServiceState(target, curAPIServer);
    store.state.serviceList[index].isViewDeployState = result.readState;
    store.state.serviceList[index].readTime = result.readTime;
    store.state.serviceList[index].replicas = result.replicas;
    store.state.serviceList[index].readErrorMsg = result.readErrorMsg;
    store.state.serviceList[index].isRecentlyRead = true;
}


async function readAllState(){
    let services = _clone(store.state.serviceList);
    for(let i=0; i<services.length; i++){
        if(services[i].state == "Service Running"){
            const name = services[i].name;
            const curAPIServer = services[i].curAPIServer;
            const result = await K8sClient.readServiceState(name, curAPIServer);
            services[i].isViewDeployState = result.readState;
            services[i].readTime = result.readTime;
            services[i].replicas = result.replicas;
            services[i].readErrorMsg = result.readErrorMsg;
            services[i].isRecentlyRead = true;
        }
    }
    store.state.serviceList = services.slice();
}



init();
export default store;


/**internal func**/
function _clone(array){
    let outputsList = [];
    array.forEach((obj)=>{
        let output = {};
        for(let i in obj){
            output[i] = obj[i];
        }
        outputsList.push(output);
    })
    return outputsList;
}


// function setCurService(curIndex){
//     const scv = store.state.serviceList[curIndex];
//     store.state.curService = {
//         'name:': scv.name,
//         'description:': scv.header.desc,
//         'company:': scv.header.company, 
//         'email:': scv.header.email,
//         'contact:': scv.header.contact,
//         'manager:':  scv.header.manager,
//         'serviceAccount:': scv.header.serviceAccont,
//         'apiServers:': scv.context.location,
//         'accessToken:': scv.context.accessToken,
//         'nodeId:': scv.context.nodeID,
//         'networkId:': scv.context.networkID,
//         'protocol': scv.context.serviceProtocol,
//         'availablePoints': scv.context.servicePoints
//     }
// }
