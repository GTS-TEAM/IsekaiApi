export enum TokenType {
  AccessToken = 'access',
  RefreshToken = 'refresh',
  VerifyEmailToken = 'verifyEmail',
  RefreshPasswordToken = 'refreshPassword',
}

export enum RolesEnum {
  ADMIN = 'admin',
  USER = 'user',
}

export enum PostFields {
  description = 'description',
  likes = 'likes',
  comments = 'comments',
}

export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum NotiStatus {
  PENDING = 'pending',
  READ = 'read',
}

export enum FriendRequestResponse {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  SEEN = 'seen',
}

export enum CommentType {
  COMMENT = 'comment',
  REPLY = 'reply',
}

export enum NotiType {
  FRIEND_REQUEST = 'friendRequest',
  FRIEND_ACCEPTED = 'friendAccepted',
  POST_COMMENT = 'postComment',
  POST_LIKE = 'postLike',
  POST_SHARE = 'postShare',
  POST_COMMENT_REPLY = 'postCommentReply',
  POST_COMMENT_REPLY_LIKE = 'postCommentReplyLike',
}

export enum ConversationType {
  PRIVATE = 'private',
  GROUP = 'group',
}

export enum PhotoRouterType {
  PROFILE = 'profile',
  PHOTO = 'photo',
}
