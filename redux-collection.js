
function arrayToObject (items, key) {
    return items.reduce(function(obj, item){
        if (typeof item[key] !== 'undefined') {
            obj[item[key]] = item;
        }
        return obj;
    }, {});
}

function sortByKey (key) {
    return function (a, b) {
        if (a[key] > b[key]) return  1;
        if (a[key] < b[key]) return -1;
        return 0;
    }
}

function matchesQuery (item, query) {
    if (!item || !query) return false;
    if (item === query) return true;
    for (var key in query) {
        if (query.hasOwnProperty(key) && item[key] != query[key]) {
            return false;
        }
    }
    return true;
}

var methods = {

    update: function () {
        switch (typeof this.orderBy) {
            case 'function':
                this.sort(this.orderBy);
                break;
            case 'string':
                Array.prototype.sort.call(this, sortByKey(this.orderBy));
                break;
        }
        return this;
    },

    get: function (id) {
        if (id == null) return void 0;
        return this.indexed[id] || this.indexed[id[this.key]];
    },

    find: function (query) {
        if (query == null) return void 0;
        return createCollection(this.filter(function (item) {
            return matchesQuery(item, query);
        }));
    },

    findOne: function (query) {
        if (query == null) return void 0;
        var result = null;
        this.some(function (item) {
            if (matchesQuery(item, query)) {
                result = item;
                return true;
            }
        });
        return result;
    },

    findIndex: function (query) {
        if (query == null) return void 0;
        var index = -1;
        this.some(function (item, i) {
            if (matchesQuery(item, query)) {
                index = i;
                return true;
            }
        });
        return index;
    },

    findLastIndex: function (query) {
        if (query == null) return void 0;
        var index = -1;
        this.reverse().some(function (item, i) {
            if (matchesQuery(item)) {
                index = i;
                return true;
            }
        });
        return (this.length - 1) - index;
    },

    sortedIndex : function (item) {
        var value = typeof item === 'string' ? item : item[this.key];
        var low = 0;
        var high = this.length;
        while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (this[mid][this.key] < value) {
                low = mid + 1
            } else {
                high = mid
            }
        }
        return low;
    },

    pluck: function (key) {
        return this.map(function (item) {
            return item[key];
        });
    },

    reject: function (fn, thisArg) {
        console.log('rejecting')
        return createCollection(this.filter(function (item, index, arr) {
            return !fn(item, index, arr);
        }, thisArg));
    },

    sortBy: function (key) {
        return this.sort(sortByKey(key));
    },

    groupBy: function (key) {
        // ...
    },

    count: function (fn) {
        return this.reduce(function (count, item, i) {
            return count + +fn(item);
        }, 0);
    },

    first: function () {
        return this[0];
    },

    last: function () {
        return this[this.length - 1];
    },

    push: function (item) {
        for (var i=0; i < arguments.length; i++){
            var item = arguments[i];
            this.indexed[item[this.key]] = item;
        }
        var res = Array.prototype.push.apply(this, arguments);
        this.update();
        return res;
    },

    unshift: function (item) {
        for (var i=0; i < arguments.length; i++){
            var item = arguments[i];
            this.indexed[item[this.key]] = item;
        }
        var res = Array.prototype.unshift.apply(this, arguments);
        this.update();
        return res;
    },

    pop: function () {
        var item = Array.prototype.pop.call(this);
        delete this.indexed[item[this.key]];
        return item;
    },

    shift: function () {
        var item = Array.prototype.shift.call(this);
        delete this.indexed[item[this.key]];
        return item;
    },

    splice: function () {
        for (var i=2; i < arguments.length; i++) {
            var item = arguments[i];
            this.indexed[item[this.key]] = item;
        }
        return Array.prototype.splice.apply(this, arguments);
    },

    add: function (item) {
        var id = item[this.key];
        if (this.indexed[id]) {
            this.replace(item);
        } else if (this.orderBy) {
            this.splice(this.sortedIndex(item), 0, item);
        } else {
            this.push(item);
        }
        return this;
    },

    insert: function (items) {
        for (var i=0; i < items.length; i++) {
            this.add(items[i]);
        }
        return this;
    },

    replace: function (item) {
        this.indexed[item[this.key]] = item;
        var index = this.indexOf(item);
        if (index === -1) index = this.findIndex(item);
        this.splice(index, 1, item);
        return this;
    },

    remove: function (query) {
        if (typeof query === 'string') {
            var index = this.sortedIndex(query);
        } else {
            var index = this.findIndex(query);
        }
        var item = this[index];
        if (!item) return this;
        this.splice(index, 1);
        delete this.indexed[item[this.key]];
        return this;
    },

    sort: function () {
        var sorted = createCollection(this);
        return Array.prototype.sort.apply(sorted, arguments);
    },

    toObject: function () {
        return Object.assign({}, this.indexed);
    }
};

;[
    'map',
    'filter',
    'concat',
    'slice'
].forEach(function(m){
    methods[m] = function () {
        return createCollection(Array.prototype[m].apply(this, arguments), {
            key: this.key,
            orderBy : this.orderBy
        });
    }
});

function addProp (obj, name, value) {
    Object.defineProperty(obj, name, { value, enumerable: false });
}

function createCollection (items, options) {
    options || (options = {});

    var arr = [];
    arr.push.apply(arr, items);

    addProp(arr, 'key',     items.key     || options.key || "id");
    addProp(arr, 'indexed', items.indexed || arrayToObject(items, arr.key));
    addProp(arr, 'orderBy', items.orderBy || options.orderBy);

    for (var m in methods) {
        if (methods.hasOwnProperty(m)) {
            addProp(arr, m, methods[m]);
        }
    }

    return arr;
}

module.exports = { createCollection }
