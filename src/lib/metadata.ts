// @ts-ignore
import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';

export interface FileMetadata {
  title: string;
  artist: string;
  coverUrl: string | null;
}

export function extractMetadata(file: File): Promise<FileMetadata> {
  return new Promise((resolve) => {
    const fallback = () => {
      resolve({
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Unknown Artist",
        coverUrl: null
      });
    };

    const timeoutId = setTimeout(() => {
      console.warn("jsmediatags timeout");
      fallback();
    }, 2000);

    try {
      jsmediatags.read(file, {
        onSuccess: (tag: any) => {
          clearTimeout(timeoutId);
          let coverUrl = null;
          if (tag.tags.picture) {
            const data = tag.tags.picture.data;
            const format = tag.tags.picture.format;
            let base64String = "";
            for (let i = 0; i < data.length; i++) {
              base64String += String.fromCharCode(data[i]);
            }
            coverUrl = `data:${format};base64,${window.btoa(base64String)}`;
          }
          resolve({
            title: tag.tags.title || file.name.replace(/\.[^/.]+$/, ""), // file name without extension
            artist: tag.tags.artist || "Unknown Artist",
            coverUrl
          });
        },
        onError: (error: any) => {
          clearTimeout(timeoutId);
          console.warn("jsmediatags error:", error);
          fallback();
        }
      });
    } catch (e) {
      clearTimeout(timeoutId);
      fallback();
    }
  });
}
