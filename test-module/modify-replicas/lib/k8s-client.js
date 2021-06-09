const fs = require('fs');
const YAML = require('yaml');
const chalk = require('chalk');
const EtcdClient = require('./etcd-client');
const Client = require('kubernetes-client').Client;
const sleep = require('sleep');
const API_VERSION = '1.13';
const jwt_decode =require("jwt-decode");
const templatePath = __dirname+'/../util/';





module.exports = class K8sClient{

  constructor(service, selectedServerIndex){
    this._setTemplate();
    this._setTokenClientInfo(service, selectedServerIndex);
  }

  _setTemplate(){
    const readList = ['pod'];
    readList.forEach((obj)=>{
      const objYaml = fs.readFileSync(`${templatePath}${obj}.yaml`, {encoding: 'utf8'});
      const objContent = YAML.parse(objYaml);
      this[obj] = objContent;
    });
  }

  _extractNamespace(token){
    const parsingInfo = jwt_decode(token);
    const namespace = parsingInfo["kubernetes.io/serviceaccount/namespace"];
    return namespace;
  }

  _getEtcdClient(urls, curReplicas){
    const etcdClient = new EtcdClient(urls, curReplicas);
    return etcdClient;
  }

  //ct = service
  _setTokenClientInfo(service, selectedServerIndex){
    this.apiServer = service.context['location'];
    this.token = service.context['accessToken'];
    this.namespace =  this._extractNamespace(this.token);
    this.servicePoints = service.context['servicePoints'];
    this.maxReplica = this.servicePoints.length;
    this.nodeID = service.context['nodeID'];
    this.servicePort = [service.context['servicePort']];
    this.networkID = service.context['networkID'];
    this.volumes =null//@FIX
    this.caCert = null;//@FIX

    if(selectedServerIndex==null) selectedServerIndex=0;

    let config = {
      url: this.apiServer[selectedServerIndex],
      request: {
        auth: {bearer: this.token},
      },
    };

    if(this.caCert == null){
      config['insecureSkipTlsVerify'] = true;
    }else{//@fix
      console.log('CHHHHHHHEEEEEKK: /lib/k8s-client  _setTokenClientInfo()');
    }
    this.k8s = new Client({config, version: API_VERSION});
  }



  /*br2k reduce -r*/
  async reduceReplicas(serviceName, curReplicas, reduceReplicas){
    for(let i=1; i <= reduceReplicas; i++){
      try{
        const etcdClient = this._getEtcdClient(this.servicePoints, curReplicas);
        const removeErr = await etcdClient.removeEndMember();
        if(removeErr!='') 
          return {msg: removeErr, curReplicas: curReplicas};

        const curPodName = serviceName+(curReplicas);
        const removeResult = await this.k8s.api.v1.namespaces(this.namespace).pods(curPodName).delete();
        
        if(removeResult.statusCode == 200){
          --curReplicas;
          console.log(chalk.green(`Successfully delete pod: ${curPodName}`));
        }else{
          return {msg: 'Pod delete Error!', curReplicas: curReplicas};
        }

        if(i == reduceReplicas)  
          return {msg: '', curReplicas: curReplicas};

        if(reduceReplicas > 1){
          console.log(chalk.grey(`The next adding takes 5 seconds..Please wait!\n`));
          sleep.sleep(5);
        }
      }catch(e){
        return {msg: e, curReplicas: curReplicas};
      }
    }
  }



  /*br2k add -r*/
  async addReplicas(serviceName, curReplicas, addReplicas, image, secret, serviceMount){
    for(let i=1; i <= addReplicas; i++){
      try{
        const etcdClient = await this._getEtcdClient(this.servicePoints, curReplicas);
        const addErr = await etcdClient.addEndMember();
        
        if(addErr!='') 
          return {msg: addErr, curReplicas: curReplicas}

        ++curReplicas;
        const pod = this._createPodTemplate(serviceName, curReplicas, image, secret, serviceMount, curReplicas, true);
        fs.writeFileSync('./pod.json',JSON.stringify(pod,0,4));

        const deplopResult = await this.k8s.api.v1.namespaces(this.namespace).pods.post({body: pod});
        
        if(deplopResult.statusCode == 201)
          console.log('\n'+chalk.greenBright(`add the ${serviceName+(curReplicas)} pod`));
        
        if(i == addReplicas)  
          return {msg: '', curReplicas: curReplicas};

        if(addReplicas > 1){
          console.log(chalk.grey(`The next adding takes 15 seconds..Please wait!\n`));
          sleep.sleep(15);
        }
      }catch(e){
        return {
         msg: e,
         curReplicas: curReplicas
        };
      }
    }
  }



  /*br2k recovery-step2*/
  async recoveryPods(serviceName, failedPodsIndex, image, secret, serviceMount, replicas){
    for(let i=0; i<failedPodsIndex.length ; i++){
      try{
        //step1: remove etcd member
        const curFailedIndex = failedPodsIndex[i];
        const etcdClient = this._getEtcdClient(this.servicePoints, replicas);
        const removeErr = await etcdClient.removeTargetMember(curFailedIndex);
        if(removeErr!='') 
          return {msg: removeErr, curReplicas: replicas};

        //step2: remove the pod
        const curPodName = serviceName+curFailedIndex;
        const removeResult = await this.k8s.api.v1.namespaces(this.namespace).pods(curPodName).delete();
        
        if(removeResult.statusCode == 200){
          console.log(chalk.green(`Successfully delete failed pod: ${curPodName}`));
          console.log(chalk.grey(`The next adding takes 20 seconds..Please wait!\n`));
          sleep.sleep(20);
        }else{
          return "Failed to recovery: Can't delete failed service";
        }

        //step3: add etcd member
        const addErr = await etcdClient.addTargetMember(curFailedIndex);
        if(addErr!='') 
          return {msg: addErr, curReplicas: replicas}

        //step4: add pod
        const pod = this._createPodTemplate(serviceName, curFailedIndex, image, secret, serviceMount, replicas, true);
        const deplopResult = await this.k8s.api.v1.namespaces(this.namespace).pods.post({body: pod});
        if(deplopResult.statusCode == 201){
          console.log('\n'+chalk.greenBright(`Redeployment to the ${curPodName} pod`));
        }
      }catch(e){
        return {msg:'failed recovery'}
      }
    }
    return {msg:'success'}
  }

  /*br2k recovery-step1*/
  async getFailedPodsIndex(serviceName, replicas){
    let failedPodIndexs = [];

    for(let i=1; i<=replicas ; i++){
      try{
        const result = await this.k8s.api.v1.namespaces(this.namespace).pods(serviceName+i).get();
        if(result.statusCode == 200){
          const pod = result.body;
          if(pod.status.phase != 'Running'){
            failedPodIndexs.push(i);
          }else{
            for(let j=0; j<pod.status.conditions.length; j++){
              const stateObj = pod.status.conditions[j];
              if(stateObj.status == 'False'){
                failedPodIndexs.push(i);
                break;
              }            
            }
          }  
        }else{
          return { msg: 'Failed to read service state', failedList: []};
        }
      }catch(e){
        console.log(e);
        return { msg: e, failedList: []};
      }
    }
    return { msg: '', failedList: failedPodIndexs};
  }

  /*For: br2k spray*/
  _initialClusterETCD(replicas){
    let arg = '';
    let urls = this.servicePoints;

    for(let i=0; i<replicas-1; i++){
      arg += `etcd${i+1}=http://${urls[i]}:2380,`;
    }
    arg += `etcd${replicas}=http://${urls[replicas-1]}:2380`;

    return arg;
  }

  /*For: br2k spray, recovery*/
  _createPodTemplate(name, podIndex, image, secret, serviceMount, replicas, isAddMode){
    let selector = this.networkID;
    let initialCluster = this._initialClusterETCD(replicas)
    let pod = this['pod'];
    let curIndex = podIndex;

    //metadata part
    let metadata = pod.metadata;
    metadata.labels = new Object;
    metadata.labels[selector] = curIndex.toString();
    metadata.name = name+curIndex.toString();
    pod.metadata = metadata;

    //spec.containers SERVICE part
    let containers = pod.spec.containers;
    let scvContainer = containers[1];
    scvContainer.image = image;
    for(let i=0; i< this.servicePort.length; i++){
      scvContainer.ports[i].name = 'port-'+i;
      scvContainer.ports[i].containerPort = parseInt(this.servicePort[i]);      
    }
    containers[1] = scvContainer;

    //volumes: etcd-repo, service-repo
    //////////////////////@FIX volume -> (etcd or service)-(type)-(info)
    const etcdNodeMount = null;
    const serviceNodeMount = null;

    if(serviceMount != null && serviceNodeMount != null){
      scvContainer.volumeMounts = new Array;
      scvContainer.volumeMounts[0] = new Object;
      scvContainer.volumeMounts[0].mountPath = serviceMount;

      if(pod.spec.volumes == null) pod.spec.volumes = new Array;

      pod.spec.volumes[1] = new Object;
      pod.spec.volumes[1].name = 'scv-repo';
      pod.spec.volumes[1].hostPath.path = serviceNodeMount;    
    }
    //spec.containers ETCD part
    let etcdContainer = containers[0];
    if(etcdNodeMount != null){
      etcdContainer.volumeMounts = new Array;
      etcdContainer.volumeMounts[0] = new Object;
      etcdContainer.volumeMounts[0].name = 'etcd-repo'
      etcdContainer.volumeMounts[0].mountPath = '/var/run/etcd';

      if(pod.spec.volumes == null) pod.spec.volumes = new Array;
      pod.spec.volumes[0] = new Object;
      pod.spec.volumes[0].name = 'etcd-repo';
      pod.spec.volumes[0].hostPath.path = etcdNodeMount;
    }
    ////////////////////////////////////////////////////////

    let etcdArg = etcdContainer.command;
    const etcdName = `etcd${curIndex}`;
    const curUrl = this.servicePoints[curIndex-1];
    etcdArg[2] = etcdName;
    etcdArg[4] = `http://${curUrl}:2380`;
    etcdArg[10] = `http://${curUrl}:2379`;
    etcdArg[12] = initialCluster;
    if(isAddMode){
      etcdArg[14] = 'existing';
    }
    containers[0].command = etcdArg;

    //add spec.containers containers
    pod.spec.containers = containers;

    //spec.nodeSelector
    const lable = this.nodeID;
    pod.spec.nodeSelector = new Object;
    pod.spec.nodeSelector[lable] = curIndex.toString();

    //spec.imagePullSecrets
    if(secret != null){
      pod.spec.imagePullSecrets = new Array;
      pod.spec.imagePullSecrets[0] = new Object;
      pod.spec.imagePullSecrets[0].name = secret;
    }
    return pod;
  }
}
