export class SendResetPasswordDto {
  email: string;
}

export class ResetPasswordDto {
  password: string;
  token: string;
}
