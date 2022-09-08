import fsExtraPkg from "fs-extra";
const { ensureDir } = fsExtraPkg;
import util from "util";
import restifyErrorsPkg from "restify-errors";
const { NotFoundError, InternalServerError, UnauthorizedError } = restifyErrorsPkg;
import path from "path";
import { orderBy } from "lodash-es";
import { getLogger } from "../common/index.js";
import * as rclone from "./file-browser_rclone.js";
import * as revaapi from "./file-browser_reva-api.js";
import * as dataverse from "./file-browser_dataverse.js";
const log = getLogger();
const localCachePath = "/srv/tmp";

export async function listFolder({ session, user, resource, folderPath, persistentId, id }) {
    let { configuration } = await setup({ user, session, resource });

    try {
        let content = [];
        if (resource === "reva" && configuration.mode === "api") {
            content = await revaapi.listFolder({
                gateway: configuration.gateway,
                token: configuration.token,
                folder: folderPath,
            });
            return orderBy(content.entries, "name");
        } else if (resource === "dataverse") {
            content = await dataverse.listFolder({
                persistentId: persistentId,
                id: id,
                host: configuration.host,
                root: configuration.rootDataverse,
                apiKey: configuration.apiKey
            });
            return orderBy(content.entries, "name");
        } else {
            if (resource === "local" && !folderPath) folderPath = "/home";
            content = await rclone.listFolder({ session, user, resource, folderPath });
            return content;
        }
    } catch (error) {
        handleError(error);
    }
}

export async function syncRemoteFileToLocal({ session, user, resource, parent, name, id }) {
    let { workingDirectory, configuration } = await setup({ user, session, resource });

    let localPath;
    try {
        if (resource === "reva" && configuration.mode === "api") {
            localPath = await revaapi.downloadFile({
                gateway: configuration.gateway,
                token: configuration.token,
                remoteFile: path.join(parent, name),
                localFile: path.join(workingDirectory, "current", name),
            });
        } if (resource === "dataverse") {
            localPath = await dataverse.downloadFile({
                host: configuration.host,
                apiKey: configuration.apiKey,
                remoteFile: path.join(parent, name),
                localFile: path.join(workingDirectory, "current", name),
                id: id,
            })
        } else {
            localPath = await rclone.syncRemoteFileToLocal({
                session,
                user,
                resource,
                parent,
                name,
            });
        }
        return localPath;
    } catch (error) {
        handleError(error);
    }
}

export async function syncLocalFileToRemote({ session, user, resource, parent, localFile, id, persistentId }) {
    let { configuration } = await setup({ user, session, resource });

    try {
        if (resource === "reva" && configuration.mode === "api") {
            await revaapi.uploadFile({
                gateway: configuration.gateway,
                token: configuration.token,
                remoteFile: path.join(parent, "ro-crate-metadata.json"),
                localFile,
            });
        } else if (resource === "dataverse") {
            await dataverse.uploadFile({
                host: configuration.host,
                apiKey: configuration.apiKey,
                localFile: localFile,
                id: id,
                persistentId: persistentId,
                session: session
            });
        } else {
            await rclone.syncLocalFileToRemote({
                session,
                user,
                resource,
                parent,
                localFile,
            });
        }
    } catch (error) {
        handleError(error);
    }
}

export async function setup({ session, user, resource }) {
    // use resource to see if we have a suitable rclone configuration
    if (!session.data.service) {
        throw new NotFoundError("No session data");
    }
    let configuration = session?.data?.service[resource];
    if (!configuration) {
        // fail not found error if not
        throw new NotFoundError("No session data");
    }
    const folderPath = localWorkingDirectory({ user });
    await ensureDir(folderPath);
    await ensureDir(path.join(folderPath, "current"));
    return { workingDirectory: folderPath, configuration };
}

export function localWorkingDirectory({ user }) {
    return path.join(localCachePath, user.id);
}

function handleError(error) {
    console.error(error);
    if (error.message.match("InvalidAuthenticationToken: Access token has expired")) {
        throw new UnauthorizedError(error.message);
    } else {
        throw new InternalServerError(error.message);
    }
}
