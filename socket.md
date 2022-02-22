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
        id: 11010752240-11014607850,
        type: private
      },
    sender: {
        id: 11010752240,
        updated_at: 2022-02-20T15:23:39.136Z,
        username: Minh Nguyen,
        roles: user,
        avatar: string,
        background: null,
        bio: null,
        phone: null,
        date: null,
        address: null,
        last_activity: 2022-02-20T15:23:39.134Z
      },
    id: 11072867748,
    created_at: 2022-02-20T15:24:08.883Z,
    updated_at: 2022-02-20T15:24:08.883Z
    }
    ```

  - **create-group:**

    **_Emit:_**

    ```
    {
      user1_id: string,
      user2_id:string
    }
    ```

    **_On:_**

    ```
    Return on event "message" type Message
    ```

  - **add-user-to-group:**

    **_Emit:_**

    ```
    {
      user_id: string,
      conversationId:string
    }
    ```

    **_On:_**

    ```
    Return on event "message" type Message
    ```
