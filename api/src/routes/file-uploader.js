import { route } from "../common/index.js";
import * as fs from 'fs';
import fetch from "node-fetch";
import {createFolder} from "../lib/file-browser_rclone.js";

export async function setupRoutes({ server }) {
	server.post("/upload", route(handleUpload));
}

export async function handleUpload(req, res, next) {
  //console.log("req.session", req.session)
  const service = req.session.data?.service
  if (service?.local?.uploadFolder) {
    const uploadFolder = service?.local?.uploadFolder
    for (var key in req.files) {
      if (req.files.hasOwnProperty(key)) {
        console.log("type of file: ", req.files[key].type)
        console.log("path of uploaded file: ", req.files[key].path)
        console.log("original name of file: ", req.files[key].name)
        if (req.files[key].type == "text/directory") {
          console.log("Creating dir: ",  "/home/"+uploadFolder+"/"+req.files[key].name)
          await createFolder({
            session: req.session,
            user: req.user,
            resource: "local",
            folderPath: "/home/"+uploadFolder+"/"+req.files[key].name
          });
        }
        else {
          const filename = req.files[key].name
          const dir = "/home/"+uploadFolder+"/"+filename.substring(0, filename.lastIndexOf("/"));
          console.log("Creating dir: ", dir)
          await createFolder({
            session: req.session,
            user: req.user,
            resource: "local",
            folderPath: dir
          });
          fs.copyFileSync(req.files[key].path, "/home/"+uploadFolder+"/"+filename)
        }
      }
    }
    res.send(202, { message: 'File uploaded' });
  }
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