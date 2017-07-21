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

    var nu = 1;
    var den = 1;

    if (!num) {
        nu = 0;
    } else {
        // pick up neither
        var chanceN;
        var chanceD = tot * num;

        var nums = [];
        var dens = [];

        chanceN = (tot - num - double) * num;
        if (chanceN > 0) {
            var rec = calc(num,double,tot - 1);
            nums.push(chanceN * rec[0]);
            dens.push(rec[1]);
        }

        // pick up card with two copies
        chanceN = (num + double) * double;
        if (chanceN > 0) {
            var rec = calc(num-1,double-1,tot-1);
            nums.push(chanceN * rec[0]);
            dens.push(rec[1]);
        }

        // pick up card with one copy   
        chanceN = (num + double) * (num - double);
        if (chanceN > 0) {
            var rec = calc(num - 1,double,tot-1);
            nums.push(chanceN * rec[0]);
            dens.push(rec[1]);
        }

        var fullN = 0;
        var fullD = chanceD;
        for (var i = 0 ; i < nums.length ; i++) {
            fullD *= dens[i];
            var n = nums[i];
            for (var j = 0 ; j < nums.length ; j++) {
                if (i === j) continue;
                n *= dens[j];
            }
            fullN += n;
        }
        den = fullD;
        nu = fullN + den;
        console.log(num,double,tot)
        data[num][double][tot] = reduce(nu,den);
    }
    return [nu,den];
}

function reduce(num,den) {
        console.log(num,den);
    for (var i = 2 ; i <= num && i <= den ; i++) {
        if (num % i === 0 && den % i === 0) {
            num /= i;
            den /= i;
            i--;
        }
    }
    return [num,den]
}