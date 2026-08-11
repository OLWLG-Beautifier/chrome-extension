export const BGG_IMAGE_MESSAGE = "olwlg:bgg-images";
export const BGG_BATCH_LIMIT = 20;

export interface BggImage {
  image?: string;
  thumbnail?: string;
}

export interface BggImageRequest {
  ids: string[];
  type: typeof BGG_IMAGE_MESSAGE;
}

export interface BggImageSuccess {
  images: Record<string, BggImage>;
  ok: true;
}

export interface BggImageFailure {
  error: string;
  ok: false;
  retryAfterMs?: number;
}

export type BggImageResponse = BggImageSuccess | BggImageFailure;