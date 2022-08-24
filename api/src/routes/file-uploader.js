import { route } from "../common/index.js";
import * as fs from 'fs';
import fetch from "node-fetch";

export async function setupRoutes({ server }) {
	server.post("/upload", route(handleUpload));
}

export async function handleUpload(req, res, next) {
		for (var key in req.files) {
			if (req.files.hasOwnProperty(key)) {
				console.log("content: "+fs.readFileSync(req.files[key].path))
			}
		}
		res.send(202, { message: 'File uploaded' });

		return next();
}

// This is for client side
export async function uploadFile(req, res, next) {
	let blob = await fetch(req.body.file.url, {
		method: 'GET',
		headers: { 'Accept': '*/*' }
	}).then(r => r.blob());
	console.log("blob: ", blob)

	return next();
}

function saveToFile(jsonData, filename) {
	console.log("SAVING: ", jsonData)
	let blob = new Blob([jsonData], { type: 'application/pdf' })
	if (navigator.msSaveBlob) { // IE 10+
		navigator.msSaveBlob(blob, filename)
	} else {
		let link = document.createElement('a')
		if (link.download !== undefined) { // feature detection
			// Browsers that support HTML5 download attribute
			let url = URL.createObjectURL(blob)
			link.setAttribute('href', url)
			link.setAttribute('download', filename)
			link.style.visibility = 'hidden'
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
		}
	}
}

function saveFile(file) {
	fs.writeFile("demo.pdf", JSON.stringify(file.file), (error, data) => {
		console.log("Write complete");
		console.log(error);
		console.log(data);
	});
}