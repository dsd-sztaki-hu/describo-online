import fetch from "node-fetch";
import {getLogger} from "../common/index.js";
import util from "util";
import {pipeline} from "stream";
import pkg from "fs-extra";
import FormData from 'form-data';
import {merge} from "lodash-es";
import models from "../models/index.js";
import restifyErrorsPkg from "restify-errors";
const { InternalServerError } = restifyErrorsPkg;

const log = getLogger();
const streamPipeline = util.promisify(pipeline);
const { createWriteStream, createReadStream, stat } = pkg;


export async function listFolder({ persistentId, id, host, root, apiKey }) {
    let entries = [];
    if (persistentId && persistentId !== "undefined:undefined/undefined") {
        // list datasets
        await fetch(host + "/api/v1/datasets/:persistentId/?persistentId=" + persistentId, {
            method: 'GET',
            headers: {
                "X-Dataverse-Key": apiKey
            },
        }).then(res => res.json())
            .then(jsonText => {
                    for (let dataverse of jsonText["data"]["latestVersion"]["files"]) {
                        let file = dataverse["dataFile"]
                        entries.push({
                            path: file["filename"],
                            name: file["filename"],
                            id: file["id"],
                            size: file["contentType"].match("unix-directory") ? -1 : file["filesize"],
                            mimeType: file["contentType"].match("unix-directory") ? "inode/directory" : file["contentType"],
                            isDir: !!file["contentType"].match("unix-directory"),
                            children: file["contentType"].match("unix-directory") ? [] : false,
                            isLeaf: !file["contentType"].match("unix-directory"),
                            parent: jsonText["data"]["publisher"],
                        });
                    }
                }
            );
    } else {
        // list dataverses
        let dataverseId = id ? id : root
        await fetch(host + `/api/v1/dataverses/${dataverseId}/contents`, {
            method: 'GET',
            headers: {
                "X-Dataverse-Key": apiKey
            },
        }).then(res => res.json())
            .then(jsonText => {
                for (let dvEntry of jsonText["data"]) {
                        entries.push({
                            path: dvEntry["type"] === "dataverse" ? dvEntry["title"] : dvEntry["identifier"],
                            name: dvEntry["type"] === "dataverse" ? dvEntry["title"] : dvEntry["identifier"],
                            persistentId: dvEntry["protocol"] + ":" + dvEntry["authority"] + "/" + dvEntry["identifier"],
                            type: dvEntry["type"],
                            id: dvEntry["id"],
                            size: -1,
                            mimeType: "inode/directory",
                            isDir: true,
                            children: [],
                            isLeaf: false,
                            parent: dvEntry["publisher"],
                        });
                    }
                }
            );
    }

    return { entries };
}

export async function downloadFile({ host, apiKey, remoteFile, localFile, id }) {
    let response = await fetch(host + "/api/v1/access/datafile/" + id, {
        method: "GET",
        headers: {
            "X-Dataverse-Key": apiKey
        },
    });
    if (response.status !== 200) {
        throw new Error(`File download from ${remoteFile} failed`);
    }
    log.debug(`syncRemoteFileToLocal: dv ${remoteFile} -> ${localFile}`);
    await streamPipeline(response.body, createWriteStream(localFile));
    return localFile;
}

export async function uploadFile({ host, apiKey, localFile, id, persistentId, session }) {
    // upload the file to dataverse
    let actId = id ? id : session.data?.service?.dataverse?.dvRoCrateId;
    let actPersId = persistentId ? persistentId : session.data?.service?.dataverse?.dvPersistentId;

    const fetchUrl = actId ? `/api/files/${actId}/replace` : "/api/datasets/:persistentId/add?persistentId=" + actPersId
    const formData = new FormData();
    formData.append('file', createReadStream(localFile));

    const response = await fetch(host + fetchUrl, {
        method: "POST",
        body: formData,
        headers: {
            "X-Dataverse-Key": apiKey
        },
    });
    const jsonResponse = await response.json();

    // dvRoCrateId is either the id of the original ro-crate.json which is loaded during syncing from dataverse at login
    // and passed to this function as "id" or the id of the newly updated ro-crate.json
    const dvRoCrateId = jsonResponse.data?.files[0]?.dataFile?.id ?? id
    if (dvRoCrateId) {
        let sessionToUpdate = await models.session.findOne({
            where: { id: session.id },
        });
        let service = await sessionToUpdate.data.service.dataverse;
        service.dvRoCrateId = dvRoCrateId;
        sessionToUpdate.data = merge(sessionToUpdate.data, {service: {["dataverse"]: service}});
        sessionToUpdate.changed("data", true);
        await sessionToUpdate.save();
    } else {
        throw new Error(`Error during updating ro-crate.json in Dataverse`);
    }

}
