import { customAlphabet } from 'nanoid';
export function generateId(options: { size?: number; constraint: number } = { constraint: 0 }) {
  const alphabet = '0123456789';
  const id = customAlphabet(alphabet, options.size);
  //11000000000
  return (options.constraint + parseInt(id())).toString();
}
