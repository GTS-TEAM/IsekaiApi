export function reverseConversationId(conversationId: string): string {
  return conversationId.split('-').reverse().join('-');
}
