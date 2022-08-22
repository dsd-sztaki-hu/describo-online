import {$http} from "../../main";


export async function uploadFile(file, url) {
	// set up the request data
	let formData = new FormData()
	formData.append('file', file.file)

	console.log("FORMDATA: ", formData)
	console.log("file: ", file)
	console.log("file.file: ", file.file)

	// track status and upload file
	file.status = 'loading'
	// let response = await fetch(url, { method: 'POST', body: formData })


	let response = await $http.post({
		route: `/folder/create`,
		body: { resource: "local", path: "/home/fintanorbert/describo_folder/test-folder" },
	});

	let response_upload = await $http.post({
		route: `/upload`,
		body: { file },
	});

	// change status to indicate the success of the upload request
	file.status = response.ok

	return response
}

export function uploadFiles(files, url) {
	return Promise.all(files.map((file) => uploadFile(file, url)))
}

export default function createUploader(url) {
	return {
		uploadFile: function (file) {
			return uploadFile(file, url)
		},
		uploadFiles: function (files) {
			return uploadFiles(files, url)
		},
	}
}
