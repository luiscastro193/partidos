"use strict";
const list = document.querySelector('ul');
const altSourceInput = document.querySelector('#alt');
const overtimeInput = document.querySelector('#overtime');
const altSource = "https://www.cope.es/api/es/programas/tiempo-de-juego/audios/rss.xml";
let overtime;

function pause(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(resource, options) {
	let response = await fetch(resource, options);
	if (response.ok) return response; else throw response;
}

async function dataPromise(source) {
	let xml = await request(source).then(response => response.text());
	return new DOMParser().parseFromString(xml, "text/xml");
}

async function secureDataPromise(source) {
	let myDocument;
	
	while (!myDocument)
		myDocument = await dataPromise(source).catch(() => pause(1500));
	
	return myDocument;
}

function preprocess(myDocument) {
	return Array.from(myDocument.getElementsByTagName('item'), item => {return {
		title: item.getElementsByTagName('title')[0].textContent
			.replace("Los Partidos de la Jornada | ", '').replace("| TIEMPO DE JUEGO", '').trim(),
		url: item.getElementsByTagName('enclosure')[0].getAttribute('url')
	}});
}

function isSecure(item) {
	let title = item.title.toLowerCase();
	return title.includes(' parte') || /\d{2}:\d{2}/.test(title) || overtime && title.includes('prórroga');
}

function toElement(item) {
	let element = document.createElement("li");
	let a = document.createElement("a");
	
	a.textContent = item.title;
	a.href = item.url;
	a.target = "_blank";
	a.rel = "noopener";
	
	element.appendChild(a);
	return element;
}

const data = secureDataPromise(document.querySelector("link[rel=preload]").href).then(myData => preprocess(myData));
let altData;

function getAltData() {
	if (!altData)
		altData = secureDataPromise(altSource).then(myData => preprocess(myData));
	
	return altData;
}

let lastUpdate = 0;

async function updateList() {
	let updateId = ++lastUpdate;
	list.innerHTML = 'Cargando...';
	let myData = await (altSourceInput.checked && getAltData() || data);
	
	if (updateId == lastUpdate) {
		overtime = overtimeInput.checked;
		list.innerHTML = '';
		list.append(...myData.filter(isSecure).map(toElement));
	}
}

updateList();
altSourceInput.onchange = updateList;
overtimeInput.onchange = updateList;
