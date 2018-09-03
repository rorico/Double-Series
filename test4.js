const fs = require("fs");
    //from various tests, it turns out that chance of getting n cards out of m cards,
    //where x cards have two in the deck follows a formula of (m+1)*c, where c is a constant.
    //I don't quite know how this is the case, but it looks like it.
    var data = [];
    //for jokers case, will only be 3 or 4, won't be counted towards double, but will towards num
    //if two jokers, just treat as normal and pass 0 for joker
    calc = function(num,double,joker,tot) {
        console.log(joker);
        if (!joker) {
            joker = 0;
        }
        if (!data[joker]) {
            data[joker] = [];
        }
        if (!data[joker][num]) {
            data[joker][num] = [];
        }
        if (data[joker][num][double]) {
            return data[joker][num][double] * (tot + 1);
        }

        var ret = 1;
        if (!num) {
            ret = 0;
        } else {
            // pick up neither
            var chance = (tot - num - double)/tot;
            if (chance > 0) {
                ret += chance * calc(num,double,joker,tot-1);
            }

            // pick up card with two copies
            var chance = 2 * double/tot;
            if (chance > 0) {
                ret += chance * calc(num-1,double-1,joker,tot-1);
            }

            // pick up card with one copy   
            var chance = (num - double - (joker ? 1 : 0))/tot;
            if (chance > 0) {
                ret += chance * calc(num-1,double,joker,tot-1);
            }

            // pick up joker   
            var chance = joker/tot;
            if (chance > 0) {
                ret += chance * calc(num-1,double,0,tot-1);
            }

            data[joker][num][double] = ret/(tot + 1);
        }
        return ret;
    }
    base = function(num,double,joker) {
        calc(num,double,joker,num + double + joker + 5);
        if (!num) {
            return 0;
        } else {
            return data[joker][num][double];
        }
    }
    base(5,2,4)
fs.writeFile("test4.json",JSON.stringify(data,null,4));