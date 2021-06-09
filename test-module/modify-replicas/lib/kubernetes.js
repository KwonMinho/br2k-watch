/**
 * About k8s command 
 */

const K8sClient = require('./k8s-client');
const { exit } = require('process');


/*MAIN*/
module.exports = async function(type, info){
    switch(type){
      case 'recovery':
        const recoveryResult = recovery(info);
        return recoveryResult;
      case 'add':
        const addResult = await add(info);
        return addResult;
      case 'reduce':
        const reduceResult = await reduce(info);
        return reduceResult;
    }
}




/*br2k reduce -r 3*/
async function reduce(info){
  console.log('reduce');
  const service = info.service;
  const reduceReplicas = parseInt(info.updateNumber);
  const serviceName = service.name;
  const curReplicas = service.curReplicas;
  const k8sClient = new K8sClient(service);
  const addResult = await k8sClient.reduceReplicas(serviceName, curReplicas, reduceReplicas);
  return addResult;
}




    //   updateNumber: updateNumber,
//   service: store.state.serviceList[scvIndex],
//   registryInfo:{
//       account: store.state.user.account,
//       password: store.state.user.password,
//   }


/*br2k add -r 3*/
async function add(info){
  console.log('add');
  const service = info.service;
  const addReplicas = parseInt(info.updateNumber);
  const serviceName = service.name;
  const curReplicas = service.curReplicas;
  const secret = service.context.secret;
  const image = service.imageInfo.image;
  const serviceMount = null //@fix
  const k8sClient = new K8sClient(service);

  const addResult = await k8sClient.addReplicas(serviceName, curReplicas, addReplicas, image, secret, serviceMount);
  return addResult;
}




/*br2k recovery*/
async function recovery(info){

  console.log('recovery');
  const service = info.service;
  const serviceName = service.name;
  const curReplicas = service.curReplicas;
  const secret = service.context.secret;
  const image = service.imageInfo.image;
  const serviceMount = null //@fix
  const k8sClient = new K8sClient(service);

  const stateResult = await k8sClient.getFailedPodsIndex(serviceName, curReplicas);
  if(stateResult.msg != ''){
    console.log(stateResult.msg);
    return;
  }
  const failedPodsIndex = stateResult.failedList;
  if(failedPodsIndex.length == 0){
    return 'There is nothing to recover';
  }

  const recoveryResult = await k8sClient.recoveryPods(serviceName, failedPodsIndex, image, secret, serviceMount, curReplicas);
  return recoveryResult;
}