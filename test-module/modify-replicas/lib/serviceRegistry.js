const ServiceRegistryClient = require('./serviceRegistry-client');

/*MAIN*/
module.exports = async function(updateInfo){

  const scvRegInfo = updateInfo.registryInfo;
  const serviceID = updateInfo.service.name;
  let totalReplicas;
  if(updateInfo.type == 'add'){
    totalReplicas = parseInt(updateInfo.service.curReplicas)+parseInt(updateInfo.updateNumber);
  }else{
    totalReplicas = parseInt(updateInfo.service.curReplicas)-parseInt(updateInfo.updateNumber);
  }
  const serviceRegistry =  await _getServiceRegistryClient(scvRegInfo);
  const resultMsg = await serviceRegistry.updateReplicas(serviceID, totalReplicas);
  return resultMsg;
}

async function _getServiceRegistryClient(scvRegInfo){
  const serviceRegistryClient = new ServiceRegistryClient(scvRegInfo);
  await serviceRegistryClient.init();
  return serviceRegistryClient;
}



