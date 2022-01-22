export class PostResponseDto {
  user: {
    id: number;
    username: string;
    email: string;
  };
  post: {
    id: number;
    image: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
