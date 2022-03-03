import { customAlphabet } from 'nanoid';
export function generateId(size: number, options: { constraint?: number } = { constraint: 0 }): string {
  const alphabet = '0123456789';
  const id = customAlphabet(alphabet, size);
  //11000000000
  return (options.constraint + parseInt(id())).toString();
}
