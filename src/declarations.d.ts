declare module "*.pdf?url" {
  const content: string;
  export default content;
}

declare module "pdfjs-dist/build/pdf.worker.js" {
  const content: string;
  export default content;
}

declare module "pdfjs-dist/build/pdf.worker?url" {
  const content: string;
  export default content;
}
