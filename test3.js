const fs = require("fs");


//from various tests, it turns out that chance of getting n cards out of m cards,
//where x cards have two in the deck follows a formula of (m+1)*c, where c is a constant.
//I don't quite know how this is the case, but it looks like it.
var data = [];

for (var num = 1 ; num <= 10 ; num++) {
    data[num] = [];
    for (var double = 0 ; double <= num ; double++) {
        var tot = num + double;
        calc(num,double,tot);
    }
}
fs.writeFile("test3.json",JSON.stringify(data,null,4));

function calc(num,double,tot) {
    if (!data[num]) {
        data[num] = [];
    }
    if (data[num][double]) {
        return data[num][double] * (tot + 1);
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
        data[num][double] = ret/(tot + 1);
    }
    return ret;
}
