const express = require('express');
const cors = require('cors');
const k8sWork = require('./lib/kubernetes');
const registryWork = require('./lib/serviceRegistry');

const app = express();
const port = 6767

app.use(express.json())
app.use(cors());

app.post('/replicas', async(req, res) => {
  const updateInfo = req.body;
  const type = updateInfo.type;

  switch(type){
      case 'add':
          const addResultMsg = await addReplicas(updateInfo);
          res.send(addResultMsg);
          break;
      case 'reduce':
          const removeResultMsg = await reduceReplicas(updateInfo);
          res.send(removeResultMsg);
          break;
      case 'recovery':
          const recoveryResultMsg = await recover(updateInfo);
          res.send(recoveryResultMsg);
          break;
      default:
          res.send("Invalid ask");
          break;
  }
})

app.listen(port, () => {
  console.log(`modify-replicas server listening at http://localhost:${port}`)
})


async function recover(updateInfo){
    const result = await k8sWork('recovery', updateInfo);
    return result;
}


async function addReplicas(updateInfo){
    const results = await k8sWork('add', updateInfo);
    if(results.msg == ''){
        const resultMsg = await registryWork(updateInfo);
        return resultMsg
    }else{
        return results.msg;
    }
}

async function reduceReplicas(updateInfo){
    const results = await k8sWork('reduce', updateInfo);
    if(results.msg == ''){
        const resultMsg = await registryWork(updateInfo);
        return resultMsg
    }else{
        return results.msg;
    }
}
