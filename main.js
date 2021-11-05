"use strict";
const list = document.querySelector('ul');
const altSourceInput = document.querySelector('#alt');
const overtimeInput = document.querySelector('#overtime');
const altSource = "https://www.cope.es/api/es/programas/tiempo-de-juego/audios/rss.xml";
let overtime;

function pause(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function dataPromise(source) {
	return new Promise((resolve, reject) => {
		let request = new XMLHttpRequest();
		request.open('GET', source);
		request.responseType = "document";
		request.onload = () => {
			if (request.status < 400)
				resolve(request.response);
			else
				reject(request.statusText);
		};
		request.onerror = () => reject(request.statusText);
		request.send();
	});
}

async function secureDataPromise(source) {
	let myDocument;
	
	while (!myDocument)
		myDocument = await dataPromise(source).catch(() => pause(1500));
	
	return myDocument;
}

function preprocess(myDocument) {
	return Array.from(myDocument.getElementsByTagName('item'), item => {return {
		title: item.getElementsByTagName('title')[0].textContent.replace("Los Partidos de la Jornada | ", '').replace(", Tiempo de Juego", ''),
		url: item.getElementsByTagName('enclosure')[0].getAttribute('url')
	}});
}

function isSecure(item) {
	let title = item.title.toLowerCase();
	return title.includes(' parte') || /de \d{2}:\d{2} a \d{2}:\d{2}/.test(title) || overtime && title.includes('prórroga');
}

function toElement(item) {
	let element = document.createElement("li");
	let a = document.createElement("a");
	
	a.textContent = item.title;
	a.href = item.url;
	a.download = item.title;
	a.target = "_blank";
	a.rel = "noopener";
	
	element.appendChild(a);
	return element;
}

const data = secureDataPromise(document.querySelector("link[rel=prefetch]").href).then(myData => preprocess(myData));
let altData;

function getAltData() {
	if (!altData)
		altData = secureDataPromise(altSource).then(myData => preprocess(myData));
	
	return altData;
}

async function updateList() {
	list.innerHTML = 'Cargando...';
	let myData = await (altSourceInput.checked && getAltData() || data);
	overtime = overtimeInput.checked;
	list.innerHTML = '';
	list.append(...myData.filter(isSecure).map(toElement));
}

updateList();
altSourceInput.onchange = updateList;
overtimeInput.onchange = updateList;
