const math = require('mathjs');

const self = module.exports = {
    Centroid: function (coordinates) {
        this.coordinates = coordinates;
        this.datapoints = []; //Matrix with points of dimension n
    },

    Stats: function (avg, max, min, range, std) {
        this.avg = avg;
        this.max = max;
        this.min = min;
        this.range = range;
        this.std = std;
    },

    //Returns for every dimension the standarddeviation
    standardDeviations: (datasets)=> {
        var stds = [];
       // var ds = math.matrix(datasets);
        for(var i = 0; i < datasets[0].length; i++) {
            var column = math.subset(datasets, math.index(math.range(0, datasets.length), i));
            var avg = column.reduce((a, b)=>{
                return parseFloat(a) + parseFloat(b);
            },0) / column.length;
            var val = 0.0;
            column.forEach((x) => {
                val += math.pow((x - avg),2.0);
            });
            val /= column.length;
            var std = math.sqrt(val);
            stds.push(std);
        } return stds;

    },

    standardDeviation: (column) => {
        var avg = column.reduce((a, b) => {
            return a + b;
        }, 0) / column.length;
        var val = 0.0;
        column.forEach((x) => {
            val += math.pow((x - avg),2.0);
        });
        val /= column.length;
        var std = math.sqrt(val);
        return std;
    },

    generateRandomCentroids: (numCentroids, datapoints)=> {
        var centroids = [];
        var indexes = [];
        for(var i = 0; i < numCentroids; i++) {
            var index = Math.floor((Math.random() * datapoints.length) + 0);
            if(indexes.length > 0) {
                if (!indexes.includes(index)) {
                    indexes.push(index);
                    var c = new self.Centroid(datapoints[index]);
                    centroids.push(c);
                } else {
                    i -= 1;
                }
            } else {
                indexes.push(index);
                var c = new self.Centroid(datapoints[index]);
                centroids.push(c);
            }
        }
        return centroids;
    },

    costFunction: (centroids) => {
        var m = 0;
        var loss = 0.0;
        centroids.forEach((centroid) => {
            m += 1;
            centroid.datapoints.forEach((point)=>{
                var dist = math.subtract(point, centroid.coordinates);
                var abs = 0.0;
                dist.forEach(function (val) {
                    abs += math.pow(val,2.0);
                });
                loss += math.sqrt(abs);
            });
        });
        loss /= m;
        return loss;
    },

    moveCentroids: (centroids) => {
        var clusters = [];
        centroids.forEach((cluster) => {
            var avg = math.zeros(cluster.datapoints[0].length);
            cluster.datapoints.forEach((point)=>{
                avg = math.add(avg, point);
            });
            cluster.coordinates = math.multiply(avg, 1.0/cluster.datapoints.length);
        });
        return centroids;
    },

    clusterAssignment: (centroids, datapoints) => {
        centroids.forEach((cluster) => {
            cluster.datapoints.length = 0;
        });
        datapoints.forEach((point)=>{
            var temp = 0.0;
            var index = 0;
            var cluster = 0;
            centroids.forEach((centroid) => {
                var euklid = 0.0;
                var distance = math.subtract(centroid.coordinates, point);
                distance.forEach((val)=>{
                    euklid += math.pow(val, 2.0);
                });
                euklid = math.sqrt(euklid);
                if(index === 0) {
                    temp = euklid;
                    cluster = index;
                }
                if(temp > euklid) {
                    cluster = index;
                    temp = euklid;
                }
                index += 1;
            });
            centroids[cluster].datapoints.push(point);
        });
        var runner = 0;
        centroids.forEach(function (del) {
            if(del.datapoints.length === 0) {
                centroids.splice(runner, 1);
            }
            runner += 1;
        });
        return centroids;
    },

    checkConvergence: (cluster)=> {
        var conv = false;
        var costs = [];
        var loss = self.costFunction(cluster);
        costs.push(loss);
        return function(cl) {
                var cost = self.costFunction(cl);
                if (cost >= costs[costs.length - 1] && costs.length >= 1) {
                    conv = true;
                }
                costs.push(cost);
                return conv;
            };
    },

    kmeans: (numCentroids, datapoints, initializations) => {
        var costs = [];
        for(var i = 0; i < initializations; i++) {
            var clusters = undefined;
            var converged = false;
            var index = 0;
            var centroids = self.generateRandomCentroids(numCentroids, datapoints);
            var checkMe = undefined;
            centroids = self.clusterAssignment(centroids, datapoints);
            //centroids = self.moveCentroids(centroids);
            checkMe = self.checkConvergence(centroids);
           // converged = checkMe(centroids);
            while (!converged) {
                centroids = self.moveCentroids(centroids);
                centroids = self.clusterAssignment(centroids, datapoints);
                converged = checkMe(centroids);
                index += 1;
            }
            costs.push({centroids: centroids, cost: self.costFunction(centroids)});
        }
        return costs;
    },

    selectBestCluster: function (clusters) {
            var cost = 0.0;
            var index = 0;
            var best = undefined;
                clusters.forEach(function (cl) {
                    if (index === 0) {
                        cost = cl.cost;
                    }
                        if (cl.cost <= cost) {
                            cost = cl.cost;
                            best = cl;
                        }
                    index += 1;
                });
                return best;


    }
};
