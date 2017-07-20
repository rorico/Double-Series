const fs = require("fs");

const NUM_TESTS = 1000;

var data = [];

for (var num = 1 ; num <= 5 ; num++) {
    data[num] = [];
    for (var double = 0 ; double <= num ; double++) {
        data[num][double] = [];
        for (var tot = num + double ; tot <= 108 ; tot++) {
            calc(num,double,tot)
        }
    }
}
fs.writeFile("test2.json",JSON.stringify(data,null,4));

function calc(num,double,tot) {
    //console.log(num,double,tot)
    if (!data[num]) {
        data[num] = [];
    }
    if (!data[num][double]) {
        data[num][double] = [];
    }
    if (data[num][double][tot]) {
        return data[num][double][tot];
    }

    var ret = 1;
    if (!num) {
        ret = 0;
    } else {
        // pick up neither
        var chance = (tot - num - double)/tot;
        if (chance > 0) {
            ret += chance * calc(num,double,tot - 1);
        }

        // pick up card with two copies
        var chance = (num + double)/tot * double/num;
        if (chance > 0) {
            ret += chance * calc(num-1,double-1,tot-1);
        }

        // pick up card with one copy   
        var chance = (num + double)/tot * (num-double)/num;
        if (chance > 0) {
            ret += chance * calc(num - 1,double,tot-1);
        }
    data[num][double][tot] = ret;
    }
    return ret;
}
