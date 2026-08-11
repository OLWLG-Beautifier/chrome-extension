export interface BggCatalogImage {
  image?: string;
  thumbnail?: string;
}

export interface BggCatalogImageResponse {
  error?: string;
  images?: Record<string, BggCatalogImage>;
  ok: boolean;
  retryAfterMs?: number;
}

export const BGG_IMAGE_BATCH_SIZE = 20;

const BGG_IMAGE_MESSAGE = "olwlg:bgg-images";

function sendBggImageBatch(ids: string[]) {
  return new Promise<BggCatalogImageResponse>((resolve, reject) => {
    chrome.runtime.sendMessage(
      { ids, type: BGG_IMAGE_MESSAGE },
      (response: BggCatalogImageResponse | undefined) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve(response ?? { error: "empty-response", ok: false });
      },
    );
  });
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function transientMessageChannelError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /message (?:channel|port) closed|receiving end does not exist/i.test(
    message,
  );
}

export async function requestBggImageBatch(ids: string[]) {
  const maximumAttempts = 4;
  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    try {
      const response = await sendBggImageBatch(ids);
      if (response.error !== "rate-limited") return response;
      if (attempt === maximumAttempts - 1) return response;
      const retryAfterMs = Math.min(
        Math.max(response.retryAfterMs ?? 1_000, 250),
        6_000,
      );
      await wait(retryAfterMs + 75);
    } catch (error) {
      if (
        attempt === maximumAttempts - 1 ||
        !transientMessageChannelError(error)
      )
        throw error;
      await wait(300 * (attempt + 1));
    }
  }
  return { error: "request-failed", ok: false };
}