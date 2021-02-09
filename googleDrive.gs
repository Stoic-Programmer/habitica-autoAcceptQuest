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
    "time" : date
  }
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

function test_trackingSpreadSheet() {
  let file = loadFile(TRACKING);
  let tracker = SpreadsheetApp.open(file);

  let sheet = tracker.getSheetByName(EVENTS);
  if (sheet === null || sheet === undefined) {
    sheet = tracker.insertSheet(EVENTS);
  }

  let range = sheet.getActiveRange();
  let cols = range.getNumColumns();
  let rows = range.getNumRows();
  let values = [];
  let row = [];
  row.push("EVENT");
  row.push("TIME");
  values.push(row);

  range.setValues(values);
  sheet.autoResizeColumns(1, 2);

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









