import {getGateway, listContainer, fileUpload, fileDownload} from "./RevaConnector";
import {request} from 'http';
import {readJSON, writeJson} from "fs-extra";
import axios from "axios";
const fs = require('fs');

export async function listFolder(path, revaToken) {
    const fileTreeContainer = [];
    const container = await listContainer(getGateway(), path, revaToken );

    for (let item of container) {
        fileTreeContainer.push({
            path: item.getPath(),
            name: item.getPath().replace(path + '/', ''),
            id: item.getId().getOpaqueId(),
            size: item.getSize(),
            modTime: new Date(item.getMtime().getSeconds() * 1000).toLocaleString(),
            isLeaf: (item.getType() !== 2),
            children: []
        });
    }

    return fileTreeContainer;
}

export async function saveFile(localFile, filename, revaToken, content) {
    const contentJSON = JSON.stringify(content);
    const uploadData = await fileUpload(getGateway(), filename, revaToken, contentJSON.length);

    try {
        const req = request(uploadData.uploadEndpoint,{
            method: 'PUT',
            headers: {
                'Tus-Resumable': '1.0.0',
                'File-Path': filename,
                'File-Size': contentJSON.length,
                'x-access-token': revaToken,
                'X-Reva-Transfer': uploadData.token,
            }

        }, response => {
            // console.log(response);
        });

        req.write(contentJSON);
        req.end();

    } catch (e) {
        console.log('error pushing file', e);
    }
}

export async function loadFile(filename, revaToken) {
    const downloadData = await fileDownload(getGateway(), filename, revaToken);
    // const tmpFile = fs.createWriteStream('/tmp/ro-crate-metadata.json');

    const downloadResponse = await axios.get(downloadData.downloadEndpoint, {
        headers: {
            'x-access-token': revaToken,
            'X-Reva-Transfer': downloadData.token,
        }
    });

    await writeJson('/tmp/ro-crate-metadata.json', downloadResponse.data);
    return downloadResponse.data;
}