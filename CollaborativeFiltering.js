const math = require('mathjs');

const self = module.exports = {
    vectorAverage: function (vec) {
        var sum = 0.0;
        var counter = 0;
        vec.forEach(function (val) {
            if(counter > 0) {
                sum += parseInt(val);
                if(parseInt(val) === 0) {
                    counter -= 1;
                }
            }
            counter += 1;
        });
        sum /= (counter-1);
        return sum;
    },

    centerVector: (ds) => {
        var clone = JSON.parse(JSON.stringify(ds));
        var vector = [];
        var index = 0;
        ds.forEach((row)=> {
            for(var vec in row) {
                vector.push(row[vec]);
            }

            var avg = self.vectorAverage(vector);

            for(var key in row) {
                if(key !== "Item") {
                    if(parseInt(row[key]) !== 0) {
                        var intVal = parseInt(row[key]);
                        clone[index][key] = intVal - avg;
                    } else {
                        clone[index][key] = 0;
                    }
                }
            }
            index += 1;
            vector.length = 0;
        });
        return clone;
    },

    cosineSimilarity: (item, ds) => {
        var result = []; //Similiarities between the given item and the other items
        var vec1 = []; //vector of searched item
        var vec2 = [];
        var mat = [[]]; //matrix of all item vetors
        var elem = {};
        ds.forEach((row)=>{

           if(row["Item"]=== item) {
               var index = 0;
               for(var key in row) {
                  if(index > 0) {
                      vec1.push(row[key]);
                  }
                  index +=1;
               }
           }
        });
        ds.forEach((row)=>{
               var index2 = 0;
            if(row["Item"]!== item) {
                var elem = {};
                elem.item = row["Item"];
                for (var key2 in row) {
                    if (index2 > 0) {
                        vec2.push(row[key2]);
                    }
                    index2 += 1;
                }
            }
            if(vec1.length > 0 && vec2.length > 0) {
                var multiVec = math.multiply(vec1, vec2);
                var under = math.multiply(math.sqrt(math.multiply(math.transpose(vec1), vec1)), math.sqrt(math.multiply(math.transpose(vec2), vec2)));
                var res = 0.0;
                if(under > 0) {
                    res = multiVec / under;
                }
                elem.sim = res;
                result.push(elem);
                vec2.length = 0;
            }
    });

        return result;
    },

    selectItem: (itemname, ds) => {
        var item = undefined;
        ds.forEach((data)=>{
            if(data["Item"] === itemname) {
                item = data;
            }
        });
        return item;
    },

    selectUser: (username, ds)=> {
        var user = {user: username, ratings: []};
        ds.forEach((data)=>{
            for(var key in data) {
                if(key === username) {
                    user.ratings.push({item: data["Item"], rating: data[key]});
                }
            }
        });
        return user;
    },

    rating: (item, user, neighbours) => {
        var result = 0.0;
        var rates = [];
        var sum = 0.0;
        neighbours.forEach((nb)=> {
            user.ratings.forEach(function (u) {
                if(u.item === nb.item && u.rating > 0 ) {
                    rates.push({rate: u.rating, sim: nb.sim});
                    result += parseInt(u.rating) * nb.sim;
                    sum += nb.sim;
                }
            });

        });
      result /=  sum;
      return result;
    },

    computeCollaborativeFiltering: (itemname, username, dataset, n) => {
        var newDS = self.centerVector(dataset);
        var similiarities = self.cosineSimilarity(itemname, newDS);
        var counter = 0;
        var big = 0.0;
        var name = "";
        var neighbours = [];
        var flag = false;
        for(var i = 0; i < n; i++) {
            big = 0.0;
            similiarities.forEach((sim) => {
                if (big < sim.sim) {
                    neighbours.forEach((ar)=>{
                        if(ar.sim === sim.sim) {
                            flag = true;
                        }
                    });
                    if(!flag) {
                        big = sim.sim;
                        name = sim.item;
                    }
                    else {
                        flag = false;
                    }
                }
            });
            neighbours.push({item: name, sim: big});
        }
        //Compute rating
        var item = self.selectItem(itemname,dataset);
        var user = self.selectUser(username, dataset);
        var rate = self.rating(item, user, neighbours);
        return rate;
    }
}