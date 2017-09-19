
const Redux      = window.Redux
const { createCollection } = require('./redux-collection')

const initialState = {
	items: createCollection([{
		id: 1,
		name: 'John'
	}, {
		id: 3,
		name: 'Sarah'
	}], { orderBy: 'id' })
}

const ADD_ITEM       = 'ADD_ITEM'
const ADD_ITEM_BATCH = 'ADD_ITEM_BATCH'
const REMOVE_ITEM    = 'REMOVE_ITEM'
const REMOVE_ALL     = 'REMOVE_ALL'

function itemsReducer (items = [], action) {
	switch (action.type) {
		case ADD_ITEM:
			return items.add(action.payload);
		case ADD_ITEM_BATCH:
			return items.insert(action.payload);
		case REMOVE_ITEM:
			return items.remove(action.payload.id);
		case REMOVE_ALL:
			uid = 1
			return createCollection([]);
		default:
			return items;
	}
}

function logTime (reducer) {
	return function (state, action) {
		console.time(action.type);
		var res = reducer(state, action);
		console.timeEnd(action.type);
		return res;
	}
}

const reducers = Redux.combineReducers({
	items: logTime(itemsReducer)
})

const store = Redux.createStore(reducers, initialState, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

window.store = store

const list = document.querySelector('#stuff')

var range;
var doc = typeof document !== 'undefined' && document;

function toElement(str) {
    if (!range && doc.createRange) {
        range = doc.createRange();
        range.selectNode(doc.body);
    }

    var fragment;
    if (range && range.createContextualFragment) {
        fragment = range.createContextualFragment(str);
    } else {
        fragment = doc.createElement('body');
        fragment.innerHTML = str;
    }
    return fragment.childNodes[0];
}

const getEngine = () => document.querySelector('#engine').value

const render = function (state) {
	console.time('render')
	var html = `<ul id="stuff">
		${state.items.map(item => {
			return `<li id="s${item.id}">${item.id}: ${item.name} <span class="remove" data-id="${item.id}">✖︎</span></li>`
		}).join("\n")}
	</ul>`
	console.timeEnd('render')
	console.time('morph')
	// setDOM(list, html)
	switch (getEngine()) {
		case 'morphdom':
			morphdom(list, html)
			break
		case 'nanomorph': 
			nanomorph(toElement(html), list)
			break
	}
	console.timeEnd('morph')
}

var _dirty = false

function batchedRender () {
	render(store.getState())
	_dirty = false
}

store.subscribe(() => {
	// if (!_dirty) {
	// 	_dirty = true
		batchedRender()
	// }
})

render(store.getState())

var pending = [
	{ id: 5, name: 'Marco' },
	{ id: 2, name: 'Brillo' },
	{ id: 4, name: 'Jessica' },
	{ id: 0, name: 'Ardy' }
]

var names = ['Marco', 'Brillo', 'Jessica', 'Ardy', 'Rody', 'Arby', 'Robert', 'Lady', 'Kate', 'John'];

function randomItem () {
	names.push(names.shift())
	uid++
	return { id: Math.floor(Math.random() * uid), name: names[0] }
}

document.querySelector('#add').addEventListener('click', function (e) {
	if (!pending.length) return;
	store.dispatch({
		type: ADD_ITEM,
		payload: randomItem()
	})
}, false)

var uid = 10

document.querySelector('#add100').addEventListener('click', function (e) {
	for (var i=0; i < 100; i++) {
		store.dispatch({
			type: ADD_ITEM,
			payload: { id: uid++, name: Math.floor(Math.random()*1e5|0).toString(32) }
		})
	}
}, false)

document.querySelector('#add1000').addEventListener('click', function (e) {
	var items = [];
	for (var i=0; i < 1000; i++) {
		items.push({ id: uid++, name: Math.floor(Math.random()*1e5).toString(32) })
	}
	store.dispatch({
		type: ADD_ITEM_BATCH,
		payload: items
	})
}, false)

document.querySelector('#add10000').addEventListener('click', function (e) {
	var items = [];
	for (var i=0; i < 10000; i++) {
		items.push({ id: uid++, name: Math.floor(Math.random()*1e5).toString(32) })
	}
	store.dispatch({
		type: ADD_ITEM_BATCH,
		payload: items
	})
}, false)

document.querySelector('#clear').addEventListener('click', function (e) {
	store.dispatch({
		type: REMOVE_ALL
	})
}, false)

list.addEventListener('click', function (e) {
	if (e.target.classList.contains('remove')) {
		var id = e.target.getAttribute('data-id');
		if (!id) return;
		store.dispatch({
			type: REMOVE_ITEM,
			payload: { id }
		})
		// var node = list.querySelector('#s' + id)
		// list.removeChild(node)
	}
})

