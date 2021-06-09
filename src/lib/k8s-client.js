import { jwt_decode } from "jwt-decode-es";
import axios from "axios";

let K8sClient = {
  clients: new Map(),
  ca: null,
  client_cert: null,
  client_key: null,

  setCert(ca, cert, key) {
    this.ca = ca;
    this.client_cert = cert;
    this.client_key = key;
  },

  setClient: function(name, token, servers) {
    const parsingInfo = this._parsingToken(token);
    const namespace = parsingInfo["kubernetes.io/serviceaccount/namespace"];
    const scvAccount =parsingInfo["kubernetes.io/serviceaccount/service-account.name"];
    const secret = parsingInfo["kubernetes.io/serviceaccount/secret.name"];

    this.clients.set(name, {
      token: token,
      servers: servers,
      namespace: namespace,
      scvAccount: scvAccount,
      secret: secret
    });
  },


  getReadLogStream: async function(scvName, curAPIServer, podName) {
    try {
      const curScv = this.clients.get(scvName);
      const res = await axios({
        url: `/api/v1/namespaces/${curScv.namespace}/pods/${podName}/log`,
        method: "get",
        baseURL: curAPIServer,
        headers: {
          Authorization: `Bearer ${curScv.token}`,
          "Content-Type": "application/json"
        },
        params: {
          container: "service",
          pretty: true
        }
      });
      console.log(res.data)
      return res.data;
    } catch (e) {
      console.log(e);
      return "Failed read log";
    }
  },

  readServiceState: async function(scvName, curAPIServer) {
    try {
      const curScv = this.clients.get(scvName);
      const res = await axios({
        url: `/api/v1/namespaces/${curScv.namespace}/pods`,
        method: "get",
        baseURL: curAPIServer,
        headers: {
          Authorization: `Bearer ${curScv.token}`,
          "Content-Type": "application/json"
        }
      });
      const readInfo = res.data.items;
      let replicas = [];
      for (let i = 0; i < readInfo.length; i++) {
        replicas.push({
          podName: readInfo[i].metadata.name,
          startTime: readInfo[i].metadata.creationTimestamp,
          restartPolicy: readInfo[i].spec.restartPolicy,
          state: this._extractState(readInfo[i].status),
          hostIP: readInfo[i].status.hostIP
        });
      }
      return {
        readState: 1,
        readTime: this._getNow(),
        replicas: replicas,
        readErrorMsg: ""
      };
    } catch (e) {
      return {
        readState: -1,
        readErrorMsg: e
      };
    }
  },

  _extractState: function(state){
    if(state.phase != "Running"){
      return state.phase;
    }
    
    for(let i=0; i< state.conditions.length; i++){
      const status = state.conditions[i].status;
      if(status=="False") return "Failed";
    }
    return state.phase;
  },

  _parsingToken: function(token) {
    return jwt_decode(token);
  },

  _getNow() {
    var a = new Date();
    var months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time =
      date + " " + month + " " + year + " " + hour + ":" + min + ":" + sec;
    return time;
  }
};

export { K8sClient };
