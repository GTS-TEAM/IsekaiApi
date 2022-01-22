// import { ConversationEntity } from 'src/conversation/entity/conversation';
// import { UserEntity } from 'src/user/user';
// import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// @Entity('messages')
// export class MessageEntity {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @ManyToOne(
//     (type) => ConversationEntity,
//     (conversation) => conversation.messages,
//     {
//       onDelete: 'CASCADE',
//     },
//   )
//   conversation: ConversationEntity;

//   @ManyToOne((type) => UserEntity, (user) => user.messages)
//   sender: UserEntity;

//   @Column()
//   content: string;

//   @CreateDateColumn()
//   created_at: Date;

//   @UpdateDateColumn()
//   updated_at: Date;
// }
