export interface IConversationFields {
  avatar?: string;
  name?: string;
  theme?: string;
  member?: MemberFields;
}

export interface MemberFields {
  id: string;
  nickname?: string;
  role?: string;
}
