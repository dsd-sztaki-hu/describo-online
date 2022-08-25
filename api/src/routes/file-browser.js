import { listFolder } from "../lib/file-browser.js";
import restifyErrorsPkg from "restify-errors";
const { BadRequestError } = restifyErrorsPkg;
import { getLogger, route } from "../common/index.js";
import {createFolder} from "../lib/file-browser_rclone.js";
import models from "../models/index.js";
const log = getLogger();

export function setupRoutes({ server }) {
    server.post("/folder/create", route(createFolderRouteHandler));
    server.post("/folder/read", route(readFolderRouteHandler));
    // server.post("/folder/delete", route(deleteFolderRouteHandler));
}
export async function readFolderRouteHandler(req, res, next) {
    let { resource, path: folderPath } = req.body;
    if (!resource) {
        log.error(`readFolderRouterHandler: resource not provided`);
        return next(new BadRequestError());
    }
    let content;
    try {
        // In case we use local with an uploadFolder, only allow listing that folder
        if (resource == "local") {
            let session = await models.session.findOne({
                where: { id: req.session.id },
            });
            if (session.data.service?.local?.uploadFolder) {
                const uploadFolder = session.data.service?.local?.uploadFolder
                // const restrictedPath = `/home/${uploadFolder}`
                // console.log("folderPath", folderPath)
                // console.log("restrictedPath", restrictedPath)
                // if (folderPath) {
                //     if (!folderPath.startsWith(restrictedPath)) {
                //         folderPath = restrictedPath
                //     }
                // }
                // else {
                //     folderPath = restrictedPath
                // }

                // Initially just show the uplaodFolder as the root. This can be selected or any of its subfolders.
                // If we listed the folderPath using listFolder it would list the contents of uplaodFolder
                // thus the uplaodFolder itself could not be selected in the UI.
                if (!folderPath || folderPath == "/home") {
                    res.send({
                        content: [
                            {
                                children: [],
                                isDir: true,
                                isLeaf: false,
                                mimeType: "inode/directory",
                                name: uploadFolder,
                                parent: "/home",
                                path: uploadFolder,
                                size: -1
                            }
                        ]
                    })
                    return next();
                }
            }
        }
        content = await listFolder({
            session: req.session,
            user: req.user,
            resource,
            folderPath,
        });
    } catch (error) {
        log.error(`readFolderRouterHandler: ${error.message}`);
        return next(error);
    }
    res.send({ content });
    return next();
}

export async function createFolderRouteHandler(req, res, next) {
    log.debug("REQ: ", req.body)
    const { resource, path: folderPath } = req.body;
    log.debug("RES: ", resource, "PATH: ", folderPath)
    if (!resource || !folderPath) {
        log.error(`createFolderRouterHandler: resource || folderPath not provided`);
        return next(new BadRequestError());
    }
    try {
        await createFolder({
            session: req.session,
            user: req.user,
            resource,
            folderPath,
        });
    } catch (error) {
        log.error(`createFolderRouterHandler: ${error.message}`);
        return next(error);
    }
    res.send();
    return next();
}

// export async function deleteFolderRouteHandler(req, res, next) {
//     const { resource, path: folderPath } = req.body;
//     if (!resource || !folderPath) {
//         log.error(`createFolderRouterHandler: resource || folderPath not provided`);
//         return next(new BadRequestError());
//     }
//     try {
//         await deleteFolder({
//             session: req.session,
//             user: req.user,
//             resource,
//             folderPath,
//         });
//     } catch (error) {
//         log.error(`deleteFolderRouterHandler: ${error.message}`);
//         return next(error);
//     }
//     res.send();
//     return next();
// }
