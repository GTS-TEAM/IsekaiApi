# SOCKET IO DOCUMENTATION

## CHAT

- **EVENTS**

  - **message:**

    **_Send:_**

    ```
    {
    "message": "string",
    "receiverId":"string"
    }
    ```

    **_Receive:_**

    ```
    {
    "content": "string",
    "conversation": {
        "id": "11010752240-11014607850",
        "type": "private"
      },
    "sender": {
        "id": "11010752240",
        "updated_at": "2022-02-20T15:23:39.136Z",
        "username": "Minh Nguyen",
        "roles": "user",
        "avatar": "https://res.cloudinary.com/titus-nguyen/image/upload/c_fill,w_40,h_40/undefined",
        "background": null,
        "bio": null,
        "phone": null,
        "date": null,
        "address": null,
        "last_activity": "2022-02-20T15:23:39.134Z"
      },
    "id": "11072867748",
    "created_at": "2022-02-20T15:24:08.883Z",
    "updated_at": "2022-02-20T15:24:08.883Z"
    }
    ```
