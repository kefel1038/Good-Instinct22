def handler(event, context):
    return {
        "statusCode": 200,
        "body": "pong",
        "headers": {"content-type": "text/plain"},
    }
