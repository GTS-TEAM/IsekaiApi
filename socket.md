# SOCKET IO DOCUMENTATION

## CHAT

- **EVENTS**

  - **message:**

    **_Enum:_**

    ```
    export enum MessageType {
      TEXT = 'text',
      IMAGE = 'image',
      VIDEO = 'video',
      AUDIO = 'audio',
      FILE = 'file',
      SYSTEM = 'system',
    }
    ```

    **_Emit:_**

    ```
    {
      message: string,
      receiverId?:string // private
      conversationId?: string // group
    }
    ```

    **_On:_**

    ```
    {
    content: string,
    conversation: {
        id: string,
        type: ConversationType
      },
    sender: {
        id: string,
        updated_at:Date,
        username: Minh Nguyen,
        roles: user,
        avatar: string,
        background: string,
        bio: string,
        phone: string,
        date: Date,
        address: string,
        last_activity: Date
      },
    id: 11072867748,
    created_at: 2022-02-20T15:24:08.883Z,
    updated_at: 2022-02-20T15:24:08.883Z
    }
    ```

  - **create-group:**

    **_Emit:_**

    ```
    [membersId]

    example:["1000123","1000456","1000789",...]
    - membersId length > 2
    ```

    **_On:_**

    ```
    Return on event "message" type Message
    ```

  - **add-members-to-group:**

    **_Emit:_**

    ```
    {
        "membersId":[
            "string",
            "string"
        ],
        "conversationId":"string"
    }
    ```

    **_On:_**

    ```
    Return on event "message" type Message
    ```

  - **leave-group:**

    **_Emit:_**

    ```
    {
      conversationId:string
    }
    ```

    **_On:_**

    ```
    Return on event "message" type Message
    ```

  - **update-group:**

    **_Emit:_**

    ```
    {
      conversationId: string;
      fields: {
        name?: string;
        avatar?: string;
        theme?: string;
      }
    }
    ```

    **_On:_**

    ```
    Return on event "message" type Message
    ```

  **_On: "error"_**

  ```
  {
    mesage:"string"
  }
  ```
