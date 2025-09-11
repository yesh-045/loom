declare module 'cheerio' {
  // Cheerio's typings can be heavy; keep minimal typing here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function load(html: string): any;
}

declare module 'pdf-parse' {
  const pdfParse: (data: Buffer) => Promise<{ text: string } & Record<string, unknown>>;
  export default pdfParse;
}

declare module 'youtube-transcript' {
  export const YoutubeTranscript: {
    fetchTranscript: (videoId: string) => Promise<Array<{ text: string; duration?: number; offset?: number }>>;
  };
}
