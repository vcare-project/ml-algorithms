var lr = require('./LinearRegression');
var logReg = require('./LogisticRegression');
var math = require('mathjs');
var fs = require('fs');
const input = [
    [1.0, 1.0],
    [1.0, 2.0],
    [1.0, 4.0],
    [1.0, 3.0],
    [1.0, 5.0]
];


const output = [1.0, 3.0, 3.0, 2.0, 5.0];
const weights = [0.0, 0.0];
const c = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0]
];

const d = [
    [0, 0],
    [1, 2],
    [3, 3],
    [0, 1],
    [0, 2]
];

var values = lr.train(0.01, input, output, weights);
console.log(values);
var j = 0;
input.forEach(function (sample) {
    var pred = lr.predictedValue(sample, values);
    console.log("X: ", sample[1], " Predicted: ", pred, " Y: ", output[j], " Error: ", pred - output[j]);
    j += 1;
});

var iterations = 10;
//var sig = logReg.sigmoid(input, d);
//console.log(sig);

var inp = [
    [1,2104],
    [1,1416],
    [1,1534],
    [1,852]
];

var mar = [
    [-40, 0.25],
    [200, 0.1],
    [-150, 0.4]
];

//var res = logReg.sigmoid(input, d);
//console.log(res);

//function sig2(x, b) {
  //  var results = [];
    //var index = 0;
    //var trans = math.transpose(b);
    //var val = math.multiply(x, math.transpose(b));
    //val.forEach(function (row) {
    //    var mat = math.multiply(math.transpose(b), row);
     //   var f = math.dotMultiply(mat,(-1));
      //  var e = math.add(1.0, math.exp(f));
        //results.push(math.dotDivide(1.0, e));
       // index += 1;
    //});
   // return results;
//}

//var test = sig2(input, d);
//console.log(test);

var csv = require('csvtojson');
const cf = require('./CollaborativeFiltering');

csv().fromFile('./Movies.csv').on('end_parsed',function (json) {
    //console.log(json);
    //json.forEach((dataset)=>{
      //  for(var ds in dataset) {
        //    var val = dataset[ds];
          //  console.log(ds+": "+val);
        //}
    //});
var r = cf.computeCollaborativeFiltering("Biking", "User5", json, 2);
console.log(r);
});

/*csv().fromFile("./User.csv").on('end_parsed', (json)=>{
    var rating = cf.computeCollaborativeFiltering("UserC", "Dancing", json, 2);
    console.log("Rating for Biking by UserB is",rating);
});*/

const km = require('./K-Means');
var cluster = km.kmeans(4, input, 100);
var result = km.selectBestCluster(cluster);
    console.log("K-Means Cost: ",result.cost);
    result.centroids.forEach(function (c) {
        console.log("Centroid: ",c.coordinates.toString());
        c.datapoints.forEach(function (dp) {
            console.log("Datapoints: ",dp.toString());
        });
    });

var data = [];
csv().fromFile("./Bloodpressure.csv").on("end_parsed",(json)=>{

    var activities = [];

    var feature = [
        {feature: "Diastolic", values : []},
        {feature: "Systolic", values: []},
        {feature: "Puls", values: []}
    ];
    json.forEach((line)=>{
        for(key in line) {
            if(key === "Diastolic") {
                feature[0].values.push(parseFloat(line[key]));
            } else
            if(key === "Systolic") {
              feature[1].values.push(parseFloat(line[key]));
            } else
                if(key === "Puls") {
                feature[2].values.push(parseFloat(line[key]));
                }
            /*if(key === "Activity") {
                if(activities.indexOf(line[key]) == -1) {
                    activities.push(line[key]);
                }
            }*/
        }
    });
    var statistics = [];
    feature.forEach((f) => {

        if (f.feature === "Diastolic") {
            var diastolicMin = Math.min.apply(null, f.values);
            var diastolicMax = Math.max.apply(null, f.values);
            var diastolicRange = diastolicMax - diastolicMin;
            var diastolicSTD = km.standardDeviation(f.values);
            var diastolicAVG = f.values.reduce((a, b)=>{
                return a + b;

            },0) / f.values.length;
            var stat = new km.Stats(diastolicAVG, diastolicMax, diastolicMin, diastolicRange, diastolicSTD);
            statistics.push({name: f.feature, statistic: stat});

            var run = 0;
            f.values.forEach((val)=>{
                val = (val - diastolicAVG) / /*diastolicRange*/ diastolicSTD;
                f.values[run] = val;
                console.log("Scaled Diastolic Value: ", val);
                run +=1;
            });

            console.log("Diastolic STD: ", diastolicSTD);
            console.log("Diastolic Min: ", diastolicMin);
            console.log("Diastolic Max: ", diastolicMax);
            console.log("Diastolic Range: ", diastolicRange);
            console.log("Diastolic AVG: ", diastolicAVG);


        } else if (f.feature === "Systolic") {
            var systolicMin = Math.min.apply(null, f.values);
            var systolicMax = Math.max.apply(null, f.values);
            var systolicRange = systolicMax - systolicMin;
            var systolicSTD = km.standardDeviation(f.values);
            var systolicAVG = f.values.reduce((a, b)=>{
                return a + b;

            },0) / f.values.length;
            var run = 0;
            f.values.forEach((val)=>{
                val = (val - systolicAVG) / /*systolicRange*/ systolicSTD;
                f.values[run] = val;
                console.log("Scaled Systolic Value: ", val);
                run += 1;
            });
            var stat = new km.Stats(systolicAVG, systolicMax, systolicMin, systolicRange, systolicSTD);
            statistics.push({name: f.feature, statistic: stat});
            console.log("Systolic STD: ", systolicSTD);
            console.log("Systolic Min: ", systolicMin);
            console.log("Systolic Max: ", systolicMax);
            console.log("Systolic Range: ", systolicRange);
            console.log("Systolic AVG: ", systolicAVG);
        }
        else if (f.feature === "Puls") {
            var pulsMin = Math.min.apply(null, f.values);
            var pulsMax = Math.max.apply(null, f.values);
            var pulsRange = pulsMax - pulsMin;
            var pulsSTD = km.standardDeviation(f.values);
            var pulsAVG = (f.values.reduce((a, b)=>{
                return a + b;

            },0) / f.values.length);
            var run = 0;
            f.values.forEach((val)=>{
                val = (val - pulsAVG) / /*pulsRange*/ pulsSTD;
                f.values[run] = val;
                console.log("Scaled Puls Value: ", val);
                run += 1;
            });
            var stat = new km.Stats(pulsAVG, pulsMax, pulsMin, pulsRange, pulsSTD);
            statistics.push({name: f.feature, statistic: stat});
            console.log("Puls STD: ", pulsSTD);
            console.log("Puls Min: ", pulsMin);
            console.log("Puls Max: ", pulsMax);
            console.log("Puls Range: ", pulsRange);
            console.log("Puls AVG: ", pulsAVG);
        }
        run +=1;
    });
    var i = 0;
    json.forEach((row)=>{
        var vector = [];
        vector.push(feature[0].values[i]);
        vector.push(feature[1].values[i]);
        vector.push(feature[2].values[i]);
        /*var index = activities.indexOf(row["Activity"]);
        console.log(index / 10);
        vector.push(index / 10); */
        i +=1;
        console.log(vector);
        data.push(vector);
    });




    var text = "";
    var rates = km.kmeans(5, data, 100);
    var final = km.selectBestCluster(rates);
    console.log("Bloodpressure Cost: ",final.cost);

    var kmed = require('./K-Medians');
    var ratings = kmed.kmedians(5, data, 100);
    var fin = kmed.selectBestCluster(ratings);
    console.log("K-Medians Cost: ",fin.cost);

    //Save new clustered datapoints to csv file.
    //text = "Diastolic, Systolic, Puls\n";
    final.centroids.forEach(function (cent) {
        var index = 0;
        cent.coordinates.forEach(function (coor) {
            var back = (coor * statistics[index].statistic.std) + statistics[index].statistic.avg;
            text += back+",";
            index +=1;
        });
       text = text.substr(0, text.length - 1);
       text += '\n';
        cent.datapoints.forEach(function (point) {
            index = 0;
            point.forEach(function (dim) {
                var backscaled = parseFloat((dim * statistics[index].statistic.std) + statistics[index].statistic.avg);
                text += backscaled +",";
                index += 1;
            });
            text = text.substring(0, text.length - 1);
            text += '\n';
        });

    });

    console.log(text);
    fs.writeFile("C:/Users/merkle/Documents/vCare/scatterplot/data.csv", text, function (err) {
        if(err)
            console.log("File could not be saved: ", err);
    });
});


/*const pythonshell = require("python-shell");
pythonshell.run("C:/Users/merkle/Documents/vCare/scatterplot/plot.py", (err) => {
    if(err) throw err;
    console.log("Finished.");
});*/
//const serve = require('serve');
//const server = serve("C:/Users/merkle/Documents/vCare/scatterplot"/*__dirname*/, {port:1234, ignore: ['node_modules']});

var cart = require('./CART');
//var res = cart.computeEntropy([6/12, 6/12]);
//console.log("Entropy: ", res);
//var res2 = cart.computeGiniIndex([20.0, 0.0], 20.0);
//console.log("Gini Index: ", res2);

var fruits1 = [
    {color:"Green", size: 3, oval: true,category: "Apple"},
    {color: "Yellow", size: 3, oval: true, category: "Apple"},
    {color: "Red", size: 1, oval: true, category: "Grape"},
    {color: "Red", size: 1, oval: true, category: "Grape"},
    {color: "Yellow", size: 3, oval: false, category: "Lemon"}
    ];

cart.executeClassificationTree("./CKD.csv", {eGFR:80, ACR:6, Hematuria:true, Hypertension:true, Diabetes:false, VascularDisease:true, MultisystemDisease:true}, "./treemodel.json");










