function parseRateLimitHeaders(response) {
  if (response === undefined) {
    return {
      limit: "",
      remain: "",
      resetTime: "",
      code: ""
    }
  }
  let headers = response.getHeaders();
  return {
    limit: headers['x-ratelimit-limit'],
    remain: headers['x-ratelimit-remaining'],
    resetTime: headers['x-ratelimit-reset'],
    code: response.getResponseCode()
  }
}