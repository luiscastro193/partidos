"use strict";
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
	return item.title.includes(' Parte');
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

secureDataPromise().then(myData => document.querySelector('ul').append(...preprocess(myData).filter(isSecure).map(toElement)));
