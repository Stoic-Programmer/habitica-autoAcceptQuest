/**
 * Functions to help support reading and writing files on google drive.
 * Permissions will be prompted by the scripts.
 */

function test_logfile() {
  // parse file for quest id and start time that was recorded.
  let date = new Date();
  let content = {
    "test": true,
    "author": AUTHOR_ID,
    "time": date

  }
  let row = buildRow(new Date(), "test log", "author", "Test the log file process.", content);
  postContent(LOG, row);
}


function test_trackingSpreadSheet() {
  let content = { "author" : AUTHOR_ID, "message" : "Hello!", "level": 200};
  let row = buildRow(new Date(), "test_trackingSpreadSheet", "demo", "Test to add rows to existing spreadsheet", JSON.stringify(content));

  logTimeSeries(EVENTS,row);
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


function loadSpreadSheet(workbook, sheetName) {
  let file = loadFile(workbook);
  let tracker = SpreadsheetApp.open(file);
  let sheet = tracker.getSheetByName(sheetName);

  if (sheet === null || sheet === undefined) {
    sheet = tracker.insertSheet(sheetName);
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









