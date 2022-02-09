export function resizeAvatar(width: number, height: number, image: string): string {
  const splitUrl = image.split('upload/')[1];
  return `https://res.cloudinary.com/titus-nguyen/image/upload/c_fill,w_${width},h_${height}/${splitUrl}`;
}
