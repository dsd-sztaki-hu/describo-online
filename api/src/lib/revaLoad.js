import {listFolder, loadFile, saveFile} from "./reva-file-browser";
import {verifyToken} from "./JWTService";
import {Crate} from "./crate";
import path from "path";
import {readJSON, writeJSON} from "fs-extra";
import {updateUserSession} from "./user";
import {localWorkingDirectory} from "./file-browser";


const defaultCrateFileName = "ro-crate-metadata.json";
const validCrateFileNames = ["ro-crate-metadata.json", "ro-crate-metadata.jsonld"];

const crateMetadata = {
    "@context": "https://w3id.org/ro/crate/1.1/context",
    "@graph": [
        {
            "@type": "CreativeWork",
            "@id": "ro-crate-metadata.json",
            conformsTo: { "@id": "https://w3id.org/ro/crate/1.1" },
            about: { "@id": "./" },
        },
        {
            "@id": "./",
            "@type": "Dataset",
            name: "my Research Object Crate",
        },
    ],
};


export async function loadRevaRouteHandler(req, res) {
    const token = req.headers.authorization.split("reva ").pop();
    const verified = verifyToken(token);
    const { resource, folder, id } = req.body;

    const container = listFolder(req.query.path, (await verified).revaToken);
    const crateManager = new Crate();

    // let crateFile = container.filter((e) => validCrateFileNames.includes(e.name));

    let localFile = path.join('/tmp/', defaultCrateFileName);

    await saveFile(localFile, defaultCrateFileName, (await verified).revaToken, crateMetadata);
    const crate = await loadFile(localFile, (await verified).revaToken);
    const { collection } = await crateManager.loadCrate(crate);

    await updateUserSession({
        sessionId: req.session.id,
        data: {
            current: {
                collectionId: collection.id,
                local: {
                    file: localFile,
                    workingDirectory: '/tmp/',
                },
                remote: {
                    resource,
                    parent: folder,
                    name: 'test',
                },
            },
        },
    });

    res.json({
        collection: {
            id: collection.id,
            name: collection.name,
            description: collection.description,
        },
    });

}