/**
 * Functions to help support reading and writing files on google drive.
 * Permissions will be prompted by the scripts.
 */

const TRACKING = "Raifton Tracking";
const QUESTS = "Quests";
const EVENTS = "EVENTS";

function test_logfile() {
  // parse file for quest id and start time that was recorded.
  let date = new Date();
  let content = {
    "test": true,
    "author": AUTHOR_ID,
    "time": date

  }
  let row = buildRow(new Date(), "test log", "author", "Test the log file process.", content);
  postContent(LOG, content);
}

function postContent(logName, content) {
  let file = loadJSONFile(logName, "");
  let jsonData = readJSONData(file);
  if (jsonData == "") {
    jsonData = [];
  }
  jsonData.push(content);
  file.setContent(JSON.stringify(jsonData));
  logTimeSeries(EVENTS, JSON.stringify(content));
  return;
}



/**
 * Loads a file form google drive.  If the 'createMissingFile'
 * is set to true and the file is not found it will be created.
 */
function loadJSONFile(name, createMissingFile) {
  var files = DriveApp.getFilesByName(name);
  if (!files.hasNext()) {
    if (createMissingFile !== undefined) {
      return createFile(name, createMissingFile);
    }
    console.error("Unable to find Google Drive file: " + name);
    return;
  }
  return files.next();
}


/**
  Parse the quest data from the log file given and return the data in a structure.
*/
function readJSONData(file) {
  let jsonFile = file.getAs("application/json");
  let jsonString = jsonFile.getDataAsString();
  if (jsonString === undefined || jsonString === "") {
    return "";
  }
  let data = JSON.parse(jsonFile.getDataAsString());
  return data;
}

function loadSpreadSheet(name) {
  let file = loadFile(TRACKING);
  let tracker = SpreadsheetApp.open(file);
  let sheet = tracker.getSheetByName(name);

  if (sheet === null || sheet === undefined) {
    sheet = tracker.insertSheet(name);
  }

  return sheet;
}

function getHeaderCols(sheet) {
  let  expected = ["TIME", "TAG", "EVENT", "MESSAGE", "DATA"];
  let rangeHeaders = sheet.getRange("A1:E1");
  let values = rangeHeaders.getValues();
  let headers = values[0];

  if ( headers[0] === '') {
    headers = expected;  
    rangeHeaders.setValues([ headers ]);
  }

  return headers;
}

function logTimeSeries( name, row) {
  let sheet = loadSpreadSheet(EVENTS);
  let headers = getHeaderCols(sheet);

  // Open up a row at the top of the sheet and past vlues there.
  sheet.insertRowBefore(2);
  let range = sheet.getRange("A2:E2");
  let values = [[row["TIME"], row["TAG"], row["EVENT"], row["MESSAGE"], row["DATA"]]];
  range.setValues(values);

  // Appends data to the end of the sheet.
  //sheet.appendRow(parseJSONrow(row));
}

function test_trackingSpreadSheet() {
  let content = { "author" : AUTHOR_ID, "message" : "Hello!", "level": 200};
  let row = buildRow(new Date(), "test_trackingSpreadSheet", "demo", "Test to add rows to existing spreadsheet", JSON.stringify(content));

  logTimeSeries(EVENTS,row);
}

/**
  Parse the quest data from the log file given and return the data in a structure.
*/
function readDataLog(file) {
  let data = { "date": new Date(), "key": "" };
  let driveFileContent = file.getAs("text/plain").getDataAsString().split("\n");
  if (driveFileContent !== undefined && driveFileContent.length >= 2) {
    data.date = new Date(driveFileContent[0]);
    data.key = driveFileContent[1];
  }
  return data;
}


/**
 * Loads a file form google drive.  If the 'createMissingFile'
 * is set to true and the file is not found it will be created.
 */
function loadFile(name, createMissingFile) {
  let files = DriveApp.getFilesByName(name);
  if (!files.hasNext()) {
    if (createMissingFile === true) {
      return createFile(name, "");
    }
    console.error("Unable to find Google Drive file: " + name);
    return;
  }
  return files.next();
}


/**
 * Creates the given file on google drive.
 */
function createFile(name, content) {
  console.log("Creating Google Drive file...: " + name);
  let file = DriveApp.createFile(name, content);
  return file;
}









