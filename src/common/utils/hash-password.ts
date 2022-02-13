import * as bcrypt from 'bcryptjs';

export function hashPassword(password: string) {
  const salt = bcrypt.genSaltSync();
  return bcrypt.hashSync(password, salt);
}
