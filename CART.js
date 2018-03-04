const math = require('mathjs');
const csv = require('csvtojson');
const fs = require('fs');
const REGRESSION = "regression";
const CLASSIFICATION = "classification";


const self = module.exports = {
    Node: function(condition, parent, isLeaf, isRoot) {
        this.condition = condition;
        this.informationGain = 0.0;
        this.parent = parent;
        this.children = [];
        this.isRoot = isRoot;
        this.isLeaf = isLeaf;
        this.yes = []; //classes
        this.no = [];
    },
    Rule: function() {
        this.key = "";
        this.condition = "";
        this.value = undefined;
        this.informationGain = 0.0;
        this.branches = {}; // Every branch consists of categories and a label e.g. yes, no, nominal name.
        this.type = "";
        this.children = {};
        this.parent = {};
        this.dataset = {};
        this.root = false;
        this.leaf = false;
    },

    computeGiniIndex : (node,count) => {
        var gini = 0.0;
        node.forEach((cl) => {
            gini += Math.pow((cl / count), 2.0);
        });
        gini = 1.0 - gini;
        return gini;
    },

    computeEntropy: (c) => {
        var entropy = 0.0;
        c.forEach((cat) => {
            if(cat !== 0.0) {
                entropy += -cat * (Math.log2(cat));
            }
        });
        return entropy;
    },

    computeInformationGain: (rule, parentsamples, sizeclasses) => {
        var infoGain = 0;
        for(var key in rule.branches) {
            var counter = 0;
            var nodeelements = 0;
            var temp = [];
            for(var key2 in rule.branches[key]) {
                temp.push(rule.branches[key][key2]);
                counter += 1;
                nodeelements += rule.branches[key][key2];
            }
            /*if(counter < sizeclasses) {
                for(var i = 0; i < sizeclasses - counter; i++) {
                    temp.push(0.0);
                }
            }*/
            for(var j = 0; j < temp.length; j++) {
                (temp[j]/=nodeelements);
            }
            if(temp.length > 0) {
                infoGain += (nodeelements / parentsamples) * self.computeEntropy(temp);
            }





        }
        return infoGain;
    },

    pureness : (parent, child) => {
        var diff = parent.gini - child.gini;
        return diff;
    },

    createRules: (dataset)=> {
        let rules = {};

        dataset.forEach((ds)=> {
                    for (var key in ds) {
                        if(key.toLowerCase().trim() !== "category") {
                            var rule = new self.Rule();
                            if (!isNaN(ds[key]) && typeof ds[key] !== "boolean") {
                                rule.condition = key + " >= " + ds[key].toString();
                                rule.value = parseFloat(ds[key]);
                                rule.type = "number";
                                rule.branches["yes"] = {};
                                rule.branches["no"] = {};
                                rule.children["yes"] = {};
                                rule.children["no"] = {};
                            }
                            else if (typeof ds[key] === "string" && ds[key] !== "false" && ds[key] !== "true") {
                                rule.condition = key+"?" /*+ "==" + ds[key]*/;
                                rule.value = ds[key];
                                rule.type = "string";
                                rule.branches[rule.value] = {};
                                rule.children[rule.value] = {};

                            }
                            else if (typeof ds[key] === "boolean" || ds[key].toLowerCase() === "false" || ds[key].toLowerCase() === "true") {
                                rule.condition = key + "==" + ds[key];
                                if(typeof ds[key] !== "boolean" && typeof ds[key] === "string") {
                                    if (ds[key].toLowerCase().trim() === "true")
                                        rule.value = true;
                                    else if (ds[key].toLowerCase().trim() === "false")
                                        rule.value = false;
                                } else {
                                    rule.value = ds[key];
                                }
                                rule.type = "boolean";
                                rule.branches["yes"] = {};
                                rule.branches["no"] = {};
                                rule.children["yes"] = {};
                                rule.children["no"] = {};
                            }
                            rule.key = key;
                            if(rule.type === "string") {
                                if(rule.key in rules) {
                                    if(!(rule.value in rules[key].branches)) {
                                        rules[key].branches[rule.value] = {};
                                        rules[key].children[rule.value] = {};
                                    }


                                } else {
                                    rule.value = "";
                                    rules[rule.key] = rule;
                                }

                            } else {
                                if(!(rule.condition in rules)) {
                                    rules[rule.condition] = rule;
                                }
                            }

                        }
                    }

            });
        return rules;
    },


    buildTree: (dataset, root) => {
        //Create rules
        var tree = undefined;
        //var iteration = 0;
           var rules = self.createRules(dataset);
            //Assign for every rule the classes and their belonging features
            for(key in rules) {
                var rule = rules[key];
                dataset.forEach((ds) => {
                    if(rule.type === "string") {
                        if(!(ds.category in rule.branches[ds[key]])) {
                            rule.branches[ds[key]][ds.category] = 1;
                        } else {
                            rule.branches[ds[key]][ds.category] += 1;
                        }
                        if(!(ds[key] in rule.dataset)) {
                            var k = ds[key];
                            rule.dataset[k] = [ds];
                        } else {
                            rule.dataset[ds[key]].push(ds);
                        }

                    } else if(rule.type === "number") {
                        ds[rule.key] = parseFloat(ds[rule.key]);
                        if(ds[rule.key] >= rule.value) {
                            if(!(ds.category in rule.branches["yes"])) {
                                rule.branches["yes"][ds.category] = 1;
                            } else {
                                rule.branches["yes"][ds.category] += 1;
                            }
                            if(!("yes" in rule.dataset)) {
                                rule.dataset["yes"] = [ds];
                            } else {
                                rule.dataset["yes"].push(ds);
                            }

                        } else {
                            if(!(ds.category in rule.branches["no"])) {
                                rule.branches["no"][ds.category] = 1;
                            } else {
                                rule.branches["no"][ds.category] += 1;
                            }

                            if(!("no" in rule.dataset)) {
                                rule.dataset["no"] = [ds];
                            } else {
                                rule.dataset["no"].push(ds);
                            }
                        }



                    } else if(rule.type === "boolean") {
                        if(typeof ds[rule.key] !== "boolean") {
                            if (ds[rule.key].toLowerCase().trim() === "true")
                                ds[rule.key] = true;
                            else if (ds[rule.key].toLowerCase().trim() === "false")
                                ds[rule.key] = false;
                        }
                        if(ds[rule.key] === rule.value) {
                            if(!(ds.category in rule.branches["yes"])) {
                                rule.branches["yes"][ds.category] = 1;
                            } else {
                                rule.branches["yes"][ds.category] += 1;
                            }
                            if(!("yes" in rule.dataset)) {
                                rule.dataset["yes"] = [ds];
                            } else {
                                rule.dataset["yes"].push(ds);
                            }
                        } else {
                            if(!(ds.category in rule.branches["no"])) {
                                rule.branches["no"][ds.category] = 1;
                            } else {
                                rule.branches["no"][ds.category] += 1;
                            }
                            if(!("no" in rule.dataset)) {
                                rule.dataset["no"] = [ds];
                            } else {
                                rule.dataset["no"].push(ds);
                            }
                        }


                    }

                });
                //Compute entropy of the parent, informationgain
                var categories = {};
                var params = [];
                var counter = 0;
                dataset.forEach((ds) => {
                    counter += 1;
                    if(!(ds.category in categories)) {
                        categories[ds.category] = 1;
                    } else {
                        categories[ds.category] += 1;
                    }
                });
                for(var key in categories) {
                    params.push(categories[key] /= counter);
                }
                var parententropy = self.computeEntropy(params);
                var gain = self.computeInformationGain(rule, counter, Object.keys(categories).length);
                var info = parententropy - gain;
                rule.informationGain = info;
            }
            var best = self.findBestNode(rules);
            if(best === undefined) {

                //for(var k in rules) {
                    //rules[k].leaf = true;
                   // rules[k].children = rules[k].branches;
               // }
                var keys = Object.keys(rules);
                for(var i = 0; i < keys.length; i++) {
                    if(rules[keys[i]].condition === root.condition) {
                        delete rules[keys[i]];
                    }
                }
                keys = Object.keys(rules);
                var index = Math.floor(Math.random() * Math.floor(keys.length));
                best = rules[keys[index]];
            }
            tree = best;
            if(root === undefined) {
                root = tree;
                root.root = true;
            }
            if(tree.informationGain === 0) {
               // if(tree.condition !== root.condition) {
                   tree.leaf = true;
                   tree.children = tree.branches;
                    return tree;
               // }

            } else {
                if(best.type !== "string") {
                    var yesBranch = self.buildTree(best.dataset["yes"], root);
                    var noBranch = self.buildTree(best.dataset["no"], root);
                    //if(yesBranch.condition !== root.condition && yesBranch.condition !== tree.condition) {
                        tree.children["yes"] = yesBranch;
                   // }
                   /* else {
                        tree.leaf = true;
                        tree.informationGain = 0;
                        tree.children = tree.branches;
                        //return tree;
                    }*/
                    //if(noBranch.condition !== root.condition && noBranch.condition !== tree.condition) {
                        tree.children["no"] = noBranch;
                   // }
                    /*else {
                        tree.leaf = true;
                        tree.informationGain = 0;
                        tree.children = tree.branches;
                       // return tree;
                    }*/
                } else {
                    for(var key in best.dataset) {
                        var br = self.buildTree(best.dataset[key], root);
                      // if(br.condition !== root.condition && br.condition !== tree.condition) {
                            tree.children[key] = br;
                       /* } else {
                            tree.leaf = true;
                            tree.informationGain = 0;
                            tree.children = tree.branches;
                           // return tree;
                        }*/
                    }
                }
            }
            return tree;


    },

    findBestNode: (rules) => {
        var best = undefined;
        var temp = 0.0;
       for(var key in rules) {
           if (rules[key].informationGain > temp) {
               temp = rules[key].informationGain;
               best = rules[key];
           }
       }

        return best;
    },

    printTree: (node) => {
       for(var child in node.children) {
           if(node.children[child].leaf !== undefined) {
               if (node.children[child].leaf === true) {
                   console.log("Parent: " + node.condition + " Branch: " + child + " Child: " + node.children[child].condition);
                   for (var key in node.children[child].children) {
                       for (var key2 in node.children[child].children[key]) {
                           console.log("Parent: "+ node.children[child].condition+" Branch: " + key + " Category: " + key2 + ":" + node.children[child].children[key][key2]);
                       }
                   }
               } else {
                   for (var key in node.children[child].children) {
                       console.log("Parent: "+node.condition+ " Branch: "+child+ " Child: "+ node.children[child].condition+ " Branch: "+ key +" Child: "+node.children[child].children[key].condition);
                       self.printTree(node.children[child].children[key]);
                   }
               }
           } else {
                       for (var key in node.children[child]) {
                               console.log("Parent: " + node.condition +" Branch: " + child + " Category: " + key + ":" + node.children[child][key]);
                       }


           }
       }
    },

    storeTree: (treemodel, path) => {
        var model = JSON.stringify(treemodel, null, 2);
        fs.writeFileSync(path, model);
    },

    loadTree: (filepath) => {
        var model = fs.readFileSync(filepath);
        model = JSON.parse(model.toString());
        return model;
    },

    loadCSVData: (file) => {
        var dataset = [];
        csv().fromFile(file).on('json',(json)=>{
            var index = 0;
            json.forEach((line) => {
                if(index === 0) {
                    //Get the keys
                    var keys = Object.keys(line);
                } else {
                    for(var i = 0; i < keys.length; i++) {
                        dataset.push({[keys[i]]: line[i]});
                    }
                }

            });

        }).on('done', (error) => {
            console.log('end');
        });
        return dataset;
    },

    predict: (datasample, tree, leafs) => {
            if(typeof  datasample[tree.key] === "string" && datasample[tree.key].toLowerCase() !== "true" && datasample[tree.key].toLowerCase() !== "false") {
                    if(!tree.leaf) {
                        self.predict(datasample, tree.children[datasample[tree.key]], leafs);
                    } else {
                        var temp = 0;
                        for(var ch in tree.children[datasample[tree.key]]) {
                               // console.log(ch +":"+tree.children[datasample[tree.key]][ch]);
                                leafs[ch] = tree.children[datasample[tree.key]][ch];
                                temp += tree.children[datasample[tree.key]][ch];
                        }
                        for(var l in leafs) {
                            leafs[l] /= temp;
                            leafs[l] *= 100;
                            leafs[l] = leafs[l].toString() + "%";
                        }
                    }
            } else if(!isNaN(datasample[tree.key]) && typeof datasample[tree.key] !== "boolean") {
                    if (datasample[tree.key] >= tree.value) {
                        if(!tree.leaf) {
                            self.predict(datasample, tree.children["yes"], leafs);
                        } else {
                            //IS a leaf node add leaf predictions
                            var counter = 0;
                            for(var num in tree.children["yes"]) {
                               // console.log(num +":"+tree.children["yes"][num]);
                                leafs[num] = tree.children["yes"][num];
                                counter += tree.children["yes"][num];
                            }
                            for(var l in leafs) {
                                leafs[l] /= counter;
                                leafs[l] *= 100;
                                leafs[l] = leafs[l].toString() + "%";
                            }

                        }
                    } else {
                        if(!tree.leaf) {
                            self.predict(datasample, tree.children["no"], leafs);
                        } else {
                            var count = 0;
                            //IS a leaf node add leaf predictions
                            for(var num in tree.children["no"]) {
                                //console.log(num +":"+tree.children["no"][num]);
                                leafs[num] = tree.children["no"][num];
                                count += tree.children["no"][num];
                            }
                            for(var l in leafs) {
                                leafs[l] /= count;
                                leafs[l] *= 100;
                                leafs[l] = leafs[l].toString() + "%";
                            }

                        }
                    }


            } else if(typeof datasample[tree.key] === "boolean" || datasample[tree.key].toLowerCase().trim() === "true" || datasample[tree.key].toLowerCase().trim() === "false") {
                if(datasample[tree.key] === tree.value) {
                    if(!tree.leaf) {
                        self.predict(datasample, tree.children["yes"], leafs);
                    } else {
                        //IS a leaf node add leaf predictions
                        var counter = 0;
                        for(var num in tree.children["yes"]) {
                           // console.log(num +":"+tree.children["yes"][num]);
                            leafs[num] = tree.children["yes"][num];
                            counter += tree.children["yes"][num];;
                        }
                        for(var l in leafs) {
                            leafs[l] /= counter;
                            leafs[l] *= 100;
                            leafs[l] = leafs[l].toString() + "%";
                        }

                    }
                } else {
                    if(!tree.leaf) {
                        self.predict(datasample, tree.children["no"], leafs);
                    } else {
                        //IS a leaf node add leaf predictions
                        var counter = 0;
                        for(var num in tree.children["no"]) {
                            //console.log(num +":"+tree.children["no"][num]);
                            leafs[num] = tree.children["no"][num];
                            counter += tree.children["no"][num];
                        }
                        for(var l in leafs) {
                            leafs[l] /= counter;
                            leafs[l] *= 100;
                            leafs[l] = leafs[l].toString() + "%";
                        }

                    }
                }
            }
            return leafs;
    },
    executeClassificationTree: (file, datasample, jsontreemodel) => {

        var dataset = [];
           var prediction = {};
           csv().fromFile(file).on('end_parsed', (json) => {
               var index = 0;
               json.forEach((line) => {
                   dataset.push(line);

               });

               var root = undefined;
               var tree = self.buildTree(dataset, root);
               self.storeTree(tree, jsontreemodel);
               var treemodel = self.loadTree(__dirname+"/treemodel.json");
               self.printTree(treemodel);

               self.predict(datasample, treemodel, prediction);
               if(Object.keys(prediction).length === 0) {
                   console.log("No result-The Prediction is uncertain.")
               } else {
                   console.log("The PREDICTION IS: ", prediction);
               }
           });

    }
}