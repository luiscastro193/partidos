"use strict";
const list = document.querySelector('ul');
const overtimeInput = document.querySelector('input');
let overtime;

function pause(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function dataPromise() {
	return new Promise((resolve, reject) => {
		let request = new XMLHttpRequest();
		request.open('GET', document.querySelector("link[rel=prefetch]").href);
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

async function secureDataPromise() {
	let myDocument;
	
	while (!myDocument)
		myDocument = await dataPromise().catch(() => pause(1500));
	
	return myDocument;
}

function preprocess(myDocument) {
	return Array.from(myDocument.getElementsByTagName('item'), item => {return {
		title: item.getElementsByTagName('title')[0].textContent.replace("Los Partidos de la Jornada | ", ''),
		url: item.getElementsByTagName('enclosure')[0].getAttribute('url')
	}});
}

function isSecure(item) {
	let title = item.title.toLowerCase();
	return title.includes(' parte') || overtime && title.toLowerCase().includes('prórroga');
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

const data = secureDataPromise().then(myData => preprocess(myData));

async function updateList() {
	let myData = await data;
	overtime = overtimeInput.checked;
	list.innerHTML = '';
	list.append(...myData.filter(isSecure).map(toElement));
}

updateList();
overtimeInput.onchange = updateList;
