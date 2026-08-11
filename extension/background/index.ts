import { BggRequestDeferredError } from "./bgg-api";
import { handleBggImageRequest } from "./cache";
import {
	BGG_BATCH_LIMIT,
	BGG_IMAGE_MESSAGE,
	type BggImageFailure,
	type BggImageRequest,
} from "./types";

function isCatalogSender(sender: chrome.runtime.MessageSender) {
	if (sender.id !== chrome.runtime.id || !sender.url) return false;
	try {
		const url = new URL(sender.url);
		return (
			url.protocol === "https:" &&
			url.hostname === "bgg.activityclub.org" &&
			(url.pathname === "/olwlg" || url.pathname.startsWith("/olwlg/"))
		);
	} catch {
		return false;
	}
}

function imageRequest(value: unknown): BggImageRequest | undefined {
	if (!value || typeof value !== "object") return undefined;
	const request = value as Partial<BggImageRequest>;
	if (request.type !== BGG_IMAGE_MESSAGE || !Array.isArray(request.ids))
		return undefined;
	const ids = [...new Set(request.ids)].filter(
		(id): id is string => typeof id === "string" && /^\d{1,12}$/.test(id),
	);
	if (ids.length === 0 || ids.length > BGG_BATCH_LIMIT) return undefined;
	return { ids, type: BGG_IMAGE_MESSAGE };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	const request = imageRequest(message);
	if (!request || !isCatalogSender(sender)) return false;

	void handleBggImageRequest(request.ids)
		.then(sendResponse)
		.catch((error: unknown) => {
			if (error instanceof BggRequestDeferredError) {
				sendResponse({
					error: "rate-limited",
					ok: false,
					retryAfterMs: error.retryAfterMs,
				} satisfies BggImageFailure);
				return;
			}
			console.warn(
				"OLWLG Beautifier could not load BGG images:",
				error instanceof Error ? error.message : "Unknown error",
			);
			sendResponse({
				error: "request-failed",
				ok: false,
			} satisfies BggImageFailure);
		});
	return true;
});