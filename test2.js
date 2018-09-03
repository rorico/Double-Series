const fs = require("fs");

//from various tests, it turns out that chance of getting n cards out of m cards,
//where x cards have two in the deck follows a formula of (m+1)*c, where c is a constant.
//I don't quite know how this is the case, but it looks like it.
var data = [];

for (var num = 1 ; num <= 5 ; num++) {
    data[num] = [];
    for (var double = 0 ; double <= num ; double++) {
        data[num][double] = [];
        for (var tot = num + double ; tot <= num + double + 1 ; tot++) {
            calc(num,double,tot)
        }
    }
}



for (var num = 1 ; num <= 5 ; num++) {
    for (var double = 0 ; double <= num ; double++) {
        var tot = num + double;
        var num1 = data[num][double][tot];
        var num2 = data[num][double][tot+1];
        var numer = num2[0] * num1[1] - num1[0] * num2[1];
        var denom = num1[1] * num2[1];
        data[num][double] = reduce(numer,denom).join("/");
    }
}
fs.writeFile("test2.json",JSON.stringify(data,null,4));

function calc(num,double,tot) {
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
        var chanceN;
        var chanceD = tot;

        var nums = [];
        var dens = [];

        // pick up neither
        // (tot - num - double) / tot
        chanceN = (tot - num - double);
        if (chanceN > 0) {
            var rec = calc(num,double,tot - 1);
            nums.push(chanceN * rec[0]);
            dens.push(rec[1]);
        }

        // pick up card with two copies
        // double * 2 / tot
        chanceN = 2 * double;
        if (chanceN > 0) {
            var rec = calc(num-1,double-1,tot-1);
            nums.push(chanceN * rec[0]);
            dens.push(rec[1]);
        }

        // pick up card with one copy
        // (num - double) / tot
        chanceN = (num - double);
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
        data[num][double][tot] = reduce(nu,den);
    }
    return [nu,den];
}

function reduce(num,den) {
    if (num > Number.MAX_SAFE_INTEGER || den > Number.MAX_SAFE_INTEGER) {
        return [num,den];
    }
    for (var i = 2 ; i <= num && i <= den ; i++) {
        if (num % i === 0 && den % i === 0) {
            num /= i;
            den /= i;
            i--;
        }
    }
    return [num,den];
}

function primeFactor(num) {
    var ret = [];
    for (var i = 2 ; i <= num ; i++) {
        if (num % i === 0) {
            ret.push(i);
            num /= i;
            if (num === 1) {
                return ret;
            }
            i--;
        }
    }
}
