const dqn = require('reinforcenode');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');

var config = {
    simulatorUrl: "ws://localhost:4444",
    path: "./dqlmodel.json"
};

var queries = {
    query1:`PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX algorithms: <http://vcare.eu/algorithms#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
select ?alpha ?episodes where { 
    ?rl rdfs:subClassOf algorithms:ReinforcementLearning.
    ?rl rdfs:label "DeepQNetwork".
    ?rl algorithms:hasLearningRate ?alpha.
    ?rl algorithms:hasEpisodes ?episodes.
}`,
    query2 :`prefix vcare:<http://vcare.eu/vcare#>
prefix rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
prefix rdfs:<http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?uc
WHERE {
?uc rdf:type vcare:UseCase.
}`,
    query3 : `prefix vcare:<http://vcare.eu/vcare#>
prefix rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
prefix rdfs:<http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?uc ?activity ?state
WHERE {
?uc rdf:type vcare:UseCase.
?uc vcare:hasState ?state.
?uc vcare:requiresActivity ?activity.
}`
}

let agent = undefined
let iterations = undefined
let usecases = undefined
let configparams = {alpha: 0.0, iterations: 0, usecases: {}}
const filepaths = { modelpath: undefined, parameterpath: undefined}

async function trainAgent(){
    let response1 = undefined
    let response2 = undefined
    let encodedquery = encodeURIComponent(queries.query1)
    let encodedquery3 = encodeURIComponent(queries.query3)
    let url =`http://localhost:7200/repositories/vcare?query=${encodedquery}`
    let url2 =`http://localhost:7200/repositories/vcare?query=${encodedquery3}`
    try {
        response1 = await axios.get(url)
        response2 = await axios.get(url2)
        let uc = initAgent(response1, response2)
        training(uc)
    }catch (e) {
        console.error(e)
    }
}

const Message = function (method, content) {
    this.method = method
    this.content = content
}

const storeModel = function(path, model) {
    let mod = JSON.stringify(model, null, 2)
    fs.writeFileSync(path, mod)
}

const loadModel = function(filepath) {
    let model = fs.readFileSync(filepath)
    model = JSON.parse(model.toString())
    return model
};

const initAgent = function(content, content2) {
    let index = 0
    let actions = []
    let states = []
        content2.data.results.bindings.forEach((elem) => {
            let action = elem.activity.value
            let st = elem.state.value
            let uc = elem.uc.value
            let keys = Object.keys(configparams.usecases)
            if(keys.length > 0) {
                if (!(uc in configparams.usecases)) {
                    configparams.usecases[uc] = {states: [st], actions: [action]}
                } else {
                    if (configparams.usecases[uc].states.indexOf(st) === -1) {
                        configparams.usecases[uc].states.push(st)
                    }
                    if (configparams.usecases[uc].actions.indexOf(action) === -1) {
                        configparams.usecases[uc].actions.push(action)
                    }
                }
            } else {
                configparams.usecases[uc] = {states: [st], actions: [action]}
            }
        })
        iterations = parseFloat(content.data.results.bindings[0].episodes.value)
        configparams.alpha = parseFloat(content.data.results.bindings[0].alpha.value)
        configparams.iterations = iterations
        usecases = Object.keys(configparams.usecases)
        return usecases[0]
}

const training = (usecase)=> {
    //The first time the agent starts, send a random action
    var index = 0
    let model = ""
    var env = {};
    env.getNumStates = function () {
        return configparams.usecases[usecase].states.length
    }
    env.getMaxNumActions = function () {
        return configparams.usecases[usecase].actions.length
    }

    let spec = {alpha: configparams.alpha}
    agent = new dqn.DQNAgent(env, spec)
    message = new Message("config", usecase)
    //let action = Math.floor(Math.random() * configparams.actions.length)

    var web = new WebSocket(config.simulatorUrl, {
        perMessageDeflate: false})
    web.on('open',function open() {
        //web.send(configparams.actions[action])
        web.send(JSON.stringify(message))
    })
    web.on('message', function incoming(data) {
        console.log("Incoming data: ",data)
        let event = JSON.parse(data)
        action = agent.act(event.state)
        agent.learn(event.reward)
        if(index < configparams.iterations) {
            message.method = "action"
            message.content = configparams.usecases[usecase].actions[action]
            web.send(JSON.stringify(message))
        }
        if (index === configparams.iterations) {
            model = agent.toJSON()
            console.log(model)
            //Save model and its parameters on a json file.
            filepaths.modelpath = "./"+usecases[0].substring(usecases[0].indexOf('#')+1)+"_model.json"
            filepaths.parameterpath = "./"+usecases[0].substring(usecases[0].indexOf('#')+1)+"_parameter.json"
            storeModel(filepaths.modelpath, model)
            storeModel(filepaths.parameterpath, configparams)
            usecases.shift()
            if(usecases.length > 0) {
                training(usecases[0])
            } else {
                web.close()
                return 0
            }
        }
        index += 1;
        console.log(index)
    })
}

const executeAgent = (parameterpath, modelpath) => {
    if(agent === null || agent === undefined) {
        configparams = loadModel(parameterpath)
        var keys = Object.keys(configparams.usecases)
        const env = {};
        env.getNumStates = function() {
            return configparams.usecases[keys[0]].states.length
        }
        env.getMaxNumActions = function () {
            return configparams.usecases[keys[0]].actions.length
        }
        agent = new dqn.DQNAgent(env);
        //Load JSON with trained model
        let model = loadModel(modelpath)
        agent.fromJSON(model)
    }
    return function (state) {
        let action = agent.act(state)
        //TODO: Send action to vCare system
        return configparams.usecases[keys[0]].actions[action];
    }
}

module.exports = {
    trainAgent: trainAgent,
    executeAgent: executeAgent,
}
//trainAgent()
let action = (executeAgent('./CKDPathway_parameter.json', './CKDPathway_model.json')([0.55, 0.33, 0.21]))
console.log(action)


