
function test_sendPrivateMessage() {
  let message = QUEST_COMPLETED_MESSAGE;
  let toUserId = USER_ID;
  api_sendPrivateMessage(message, toUserId);
}


/**
 * Fetches the ratelimit data from the response and puts
 * it into an opbject for further processing.  The
 * rate limit data tells us if we need to stop processing and
 * wait a short bit before sending again.
 */
function buildHeader(response) {
  if (response === undefined) {
    return {
      "limit": "",
      "remain": "",
      "resetTime": "",
      "code": "",
      "result" : ""
    };
  }

  let headers = response.getHeaders();
  let content = JSON.parse(response);
  let limit = headers['x-ratelimit-limit'];
  let remain = headers['x-ratelimit-remaining'];
  let resetTime = headers['x-ratelimit-reset'];
  let code = response.getResponseCode();
  return {
    "limit": limit,
    "remain": remain,
    "resetTime": resetTime,
    "code": code,
    "result" : content
  };
}