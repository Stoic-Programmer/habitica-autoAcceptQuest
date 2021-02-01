function parseRateLimitHeaders(response) {
  if (response === undefined) {
    return {
      "limit": "",
      "remain": "",
      "resetTime": "",
      "code": ""
    };
  }

  let headers = response.getHeaders();
  let limit = headers['x-ratelimit-limit'];
  let remain = headers['x-ratelimit-remaining'];
  let resetTime = headers['x-ratelimit-reset'];
  let code = response.getResponseCode();
  return {
    "limit": limit,
    "remain": remain,
    "resetTime": resetTime,
    "code": code
  };
}

function test_sendPrivateMessage() {
  let message = QUEST_COMPLETED_MESSAGE;
  let toUserId = USER_ID;
  api_sendPrivateMessage(message, toUserId);
}