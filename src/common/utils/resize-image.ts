export function resizeAvatar(width: number, height: number, image: string): string {
  if (!image.includes('https://lh3.googleusercontent.com/')) {
    const splitUrl = image.split('upload/')[1];
    return `https://res.cloudinary.com/titus-nguyen/image/upload/c_fill,w_${width},h_${height}/${splitUrl}`;
  }
  return image;
}
