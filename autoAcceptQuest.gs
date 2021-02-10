/**
 * https://habitica.fandom.com/wiki/Google_Apps_Script#Faster_Auto_Accept_Quests_and_Auto_Notify_on_Quest_End
 * 
 * 2021-02-08 Add google doc/sheet logging.
 */

const scriptProperties = PropertiesService.getScriptProperties();

/* ========================================== */
/* [Users] Required script data to fill in    */
/* ========================================== */
const USER_ID = scriptProperties.getProperty("apiUser");
const API_TOKEN = scriptProperties.getProperty("apiToken"); // Do not share this to anyone
const WEB_APP_URL = scriptProperties.getProperty("appURL");

/* ========================================== */
/* [Users] Required customizations to fill in */
/* ========================================== */
const LOG = "habitica-autoAcceptQuest.json";

/* ========================================== */
/* [Users] Optional customizations to fill in */
/* ========================================== */
const ENABLE_AUTO_ACCEPT_QUESTS = 1;
const ENABLE_QUEST_COMPLETED_NOTIFICATION = 1;

/* ========================================== */
/* [Users] Do not edit code below this line   */
/* ========================================== */
//const AUTHOR_ID = "01daa187-ff5e-46aa-ac3f-d4c529a8c012";  // Original author.
const AUTHOR_ID = "ebded617-5b88-4f67-9775-6c89ac45014f"; // Rafton on Habitica
const SCRIPT_NAME = "autoAcceptQuest";

const HEADERS = {
  "x-client": AUTHOR_ID + "-" + SCRIPT_NAME,
  "x-api-user": USER_ID,
  "x-api-key": API_TOKEN,
}

const WAIT_ONGOING_MESSAGE = "**ERROR: Script Failed**  \n\n"
  + "Script Name: " + SCRIPT_NAME + "  \n"
  + "Reason: Exceeded [rate limit](https://habitica.fandom.com/wiki/User_blog:LadyAlys/Rate_Limiting_(Intentional_Slow-Downs)_in_Some_Third-Party_Tools)  \n"
  + "Recommendation: Please avoid manually triggering scripts too quickly, or triggering a different script while another one is not yet finished running. By the time you receive this message, it should now be okay to manually trigger scripts again.";

const QUEST_COMPLETED_MESSAGE = "Quest Completed.";
const RESPONSE_OK_MIN = 200; // HTTP status code minimum
const RESPONSE_OK_MAX = 299; // HTTP status code maximum
const MAX_RETRIES = 4; // Total of MAX_RETRIES + 1 tries

var waitOngoing = Number(scriptProperties.getProperty("waitOngoing"));
var retryCount = Number(scriptProperties.getProperty("retryCount"));

// Function arguments made global for compatibility with ScriptApp.newTrigger() triggering
var message = scriptProperties.getProperty("message");
var toUserId = scriptProperties.getProperty("toUserId");

function doOneTimeSetup() {
  if (waitOngoing) {
    message = WAIT_ONGOING_MESSAGE;
    toUserId = USER_ID;
    api_sendPrivateMessage_waitRetryOnFail();
  }
  else {
    scriptProperties.setProperty("waitOngoing", 0);
    scriptProperties.setProperty("retryCount", 0);

    scriptProperties.setProperty("message", "");
    scriptProperties.setProperty("toUserId", USER_ID);

    api_createWebhook_waitRetryOnFail();
    deleteTriggers("api_acceptQuest");
    ScriptApp.newTrigger("api_acceptQuest").timeBased().everyHours(1).create();
  }
}

function buildRow(time, tag, event, message, data) {
  return {
    "TIME": time,
    "TAG": tag,
    "EVENT": event,
    "MESSAGE": message,
    "DATA": data
  }
}


/**
 * {
 * "enabled": true,
 * "url": "http://some-webhook-url.com",
 * "label": "My Quest Webhook",
 * "type": "questActivity",
 * "options": { // set at least one to true
 *   "questStarted": false,  // default
 *   "questFinished": false, // default
 *   "questInvited": false,  // default
 * }
 *}
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const webhookType = data.webhookType;
  const questActivity = data.type;
  postContent(LOG, buildRow(new Date(), "doPost", webhookType, questActivity, JSON.stringify(data)));

  if (webhookType === "questActivity") {
    if ((questActivity === "questInvited") && ENABLE_AUTO_ACCEPT_QUESTS) {
      api_acceptQuest_waitRetryOnFail();
    }
    else if ((questActivity === "questFinished") && ENABLE_QUEST_COMPLETED_NOTIFICATION) {
      message = QUEST_COMPLETED_MESSAGE + " for " + data.quest.key;
      toUserId = USER_ID;
      api_sendPrivateMessage_waitRetryOnFail();
    }
    else if (questActivity === "questStarted") {
      // Add work for quest start?  Cast damage spells?  Something else?
    }
  }
  return HtmlService.createHtmlOutput();
}

function api_createWebhook() {
  const payload = {
    "url": WEB_APP_URL,
    "label": SCRIPT_NAME + " Webhook",
    "type": "questActivity",
    "options": {
      "questInvited": true,
      "questFinished": true,
    },
  }

  const params = {
    "method": "post",
    "headers": HEADERS,
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true,
  }

  const url = "https://habitica.com/api/v3/user/webhook";
  return UrlFetchApp.fetch(url, params);
}

function api_acceptQuest() {
  const params = {
    "method": "post",
    "headers": HEADERS,
    "muteHttpExceptions": true,
  }

  const url = "https://habitica.com/api/v3/groups/party/quests/accept";
  let response = UrlFetchApp.fetch(url, params);
  postContent(LOG, buildRow(new Date(), "api_acceptQuest", url, "API call results", JSON.stringify(buildHeader(response))));
  return response;
}

function api_sendPrivateMessage(message, toUserId) {
  const payload = {
    "message": message,
    "toUserId": toUserId,
  }

  const params = {
    "method": "post",
    "headers": HEADERS,
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true,
  }

  postContent(LOG, buildRow(new Date(), "api_sendPrivateMessage", "", "prepare message", params));

  const url = "https://habitica.com/api/v3/members/send-private-message";
  let response = UrlFetchApp.fetch(url, params);
  postContent(LOG, buildRow(new Date(), "api_sendPrivateMessage", url, "result of API call", JSON.stringify(buildHeader(response))));
  return response;
}

function api_createWebhook_waitRetryOnFail() {
  deleteTriggers("api_createWebhook_waitRetryOnFail");

  // Attempt normal function
  const response = api_createWebhook();

  // if HTTP response is not 200 OK, and max retries have not been reached
  if (((response.getResponseCode() < RESPONSE_OK_MIN) || (response.getResponseCode() > RESPONSE_OK_MAX)) && (retryCount < MAX_RETRIES)) {
    assertWaitOngoingAndIncrementRetryCount();

    // Set trigger to retry function (Google Apps Script's timing is inconsistent, actual range for "(10 * 1000)" is from 26 to 83sec)
    ScriptApp.newTrigger("api_createWebhook_waitRetryOnFail").timeBased().after(10 * 1000).create();
  }
  else {
    resetRetryCountAndWaitOngoing();
  }
}

function api_acceptQuest_waitRetryOnFail() {
  deleteTriggers("api_acceptQuest_waitRetryOnFail");

  // Attempt normal function
  const response = api_acceptQuest();

  // if HTTP response is not 200 OK, and max retries have not been reached
  if (((response.getResponseCode() < RESPONSE_OK_MIN) || (response.getResponseCode() > RESPONSE_OK_MAX)) && (retryCount < MAX_RETRIES)) {
    assertWaitOngoingAndIncrementRetryCount();

    // Set trigger to retry function (Google Apps Script's timing is inconsistent, actual range is from 26 to 83sec)
    ScriptApp.newTrigger("api_acceptQuest_waitRetryOnFail").timeBased().after(10 * 1000).create();
  }
  else {
    resetRetryCountAndWaitOngoing();
  }
}

function api_sendPrivateMessage_waitRetryOnFail() {
  deleteTriggers("api_sendPrivateMessage_waitRetryOnFail");

  // Attempt normal function
  const response = api_sendPrivateMessage(message, toUserId);

  // if HTTP response is not 200 OK, and max retries have not been reached
  if (((response.getResponseCode() < RESPONSE_OK_MIN) || (response.getResponseCode() > RESPONSE_OK_MAX)) && (retryCount < MAX_RETRIES)) {
    assertWaitOngoingAndIncrementRetryCount();

    // Set trigger to retry function (Google Apps Script's timing is inconsistent, actual range for "(10 * 1000)" is from 26 to 83sec)
    ScriptApp.newTrigger("api_sendPrivateMessage_waitRetryOnFail").timeBased().after(10 * 1000).create();

    // Save arguments as script properties so that the retry will have the same arguments
    scriptProperties.setProperty("message", message);
    scriptProperties.setProperty("toUserId", toUserId);
  }
  else {
    resetRetryCountAndWaitOngoing();
  }
}

function deleteTriggers(functionName) {
  // Delete triggers to functionName to avoid reaching the maximum number of triggers
  const triggers = ScriptApp.getProjectTriggers();

  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == functionName) {
      ScriptApp.deleteTrigger(triggers[i])
    }
  }
}

function assertWaitOngoingAndIncrementRetryCount() {
  // Assert waitOngoing to prevent further fresh manual triggering of the script while waiting
  waitOngoing = 1;
  scriptProperties.setProperty("waitOngoing", waitOngoing);

  // Increment retryCount
  retryCount++;
  scriptProperties.setProperty("retryCount", retryCount);
}

function resetRetryCountAndWaitOngoing() {
  const triggers = ScriptApp.getProjectTriggers();

  if (triggers.length === 0) {
    // Reset retryCount and waitOngoing to allow script access with full retries once again
    retryCount = 0;
    scriptProperties.setProperty("retryCount", retryCount);
    waitOngoing = 0;
    scriptProperties.setProperty("waitOngoing", waitOngoing);
  }
}