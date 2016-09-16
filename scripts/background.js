/*jslint indent: 2 */
/*global window: false, XMLHttpRequest: false, chrome: false, btoa: false */
"use strict";
var TogglButton = {
  $user: null,
  $apiUrl: "https://www.toggl.com/api/v7",
  $newApiUrl: "https://www.toggl.com/api/v8",
  $databaseUrl: "http://dev2.despark.com/toggl_button",
  $sites: new RegExp([
    'asana\\.com',
    'podio\\.com',
    'trello\\.com',
    'github\\.com',
    'bitbucket\\.org',
    'gitlab\\.com',
    'redbooth\\.com',
    'teamweek\\.com',
    'basecamp\\.com',
    'unfuddle\\.com',
    'worksection\\.com',
    'pivotaltracker\\.com',
    'producteev\\.com'].join('|')),
  $curEntryId: null,
  $curTaskId: null,

  checkUrl: function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      if (TogglButton.$sites.test(tab.url)) {
        TogglButton.setPageAction(tabId);
      } else if (/toggl\.com\/track/.test(tab.url)) {
        TogglButton.fetchUser(TogglButton.$apiUrl);
      } else if (/toggl\.com\/app/.test(tab.url)) {
        TogglButton.fetchUser(TogglButton.$newApiUrl);
      }
    }
  },

  fetchUser: function (apiUrl) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function(){
      if (xhr.status === 200) {
        var projectMap = {}, resp = JSON.parse(xhr.responseText);
        if (resp.data.projects) {
          resp.data.projects.forEach(function (project) {
            projectMap[project.name] = project.id;
          });
        }
        TogglButton.$user = resp.data;  
        TogglButton.$user.projectMap = projectMap;
        // chrome.runtime.sendMessage({project_map: projectMap});

      } else if (apiUrl === TogglButton.$apiUrl) {
        TogglButton.fetchUser(TogglButton.$newApiUrl);
      }
    }

    xhr.open("GET", apiUrl + "/me?with_related_data=true", true);
    // xhr.onload = function () {
    //   if (xhr.status === 200) {
    //     var projectMap = {}, resp = JSON.parse(xhr.responseText);
    //     if (resp.data.projects) {
    //       resp.data.projects.forEach(function (project) {
    //         projectMap[project.name] = project.id;
    //       });
    //     }
    //     TogglButton.$user = resp.data;
    //     TogglButton.$user.projectMap = projectMap;

    //     // chrome.runtime.sendMessage({project_map: projectMap});

    //   } else if (apiUrl === TogglButton.$apiUrl) {
    //     TogglButton.fetchUser(TogglButton.$newApiUrl);
    //   }
    // };

    xhr.send();
  },

  createTimeEntry: function (timeEntry) {
    var start = new Date(),
      xhr = new XMLHttpRequest(),
      entry = {
        time_entry: {
          start: start.toISOString(),
          description: timeEntry.description,
          wid: TogglButton.$user.default_wid,
          pid: timeEntry.projectId || null,
          tid: timeEntry.tid || null,
          billable: timeEntry.billable || false,
          duration: -(start.getTime() / 1000),
          created_with: timeEntry.createdWith || 'TogglButton',
          tags: timeEntry.tags
        }
      };
    if (timeEntry.projectName !== undefined) {
      entry.time_entry.pid = TogglButton.$user.projectMap[timeEntry.projectName];
    }

    //Create a new Project incase the projects map array doesn't already contain the requested project
    if (timeEntry.projectName !== undefined && timeEntry.projectName != "" && (entry.time_entry.pid == null || entry.time_entry.pid == undefined)) {
      if (confirm('Toggl couldn\'t find a project called "' + timeEntry.projectName + '". Would you like to create one now ?')){
        TogglButton.createNewProject(timeEntry.projectName,timeEntry);
        return false; //stop here until the new project is created
      }
    }
    
      if (entry.time_entry.tid === null) {
        if (timeEntry.description.match(/\s\[(\d+)(min|h|d|wk)\]/) !== null) { 
            TogglButton.checkIfTaskExistsInDatabase(timeEntry.description, entry.time_entry.pid, function(check) {
              if (check === null || check === '') {
                 TogglButton.createNewTask(timeEntry.description, entry.time_entry.wid, entry.time_entry.pid, function(tid) {
                  if (tid !== null) {
                    TogglButton.saveTaskToDatabase(timeEntry.description, entry.time_entry.pid, tid);
                    entry.time_entry.tid = tid;
                    TogglButton.createTimeEntryRequest(entry, xhr);
                  }
                });
              } else {
                entry.time_entry.tid = check;
                TogglButton.createTimeEntryRequest(entry, xhr);
              }
            });
        } else {
          TogglButton.createTimeEntryRequest(entry, xhr);
        }
    } else {
      TogglButton.createTimeEntryRequest(entry, xhr);
    }
  },

  createTimeEntryRequest: function (entry, xhr) {
    xhr.open("POST", TogglButton.$newApiUrl + "/time_entries", true);
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(TogglButton.$user.api_token + ':api_token'));

    // handle response
    xhr.addEventListener('load', function (e) {
      var responseData, entryId;
      responseData = JSON.parse(xhr.responseText);
      entryId = responseData && responseData.data && responseData.data.id;
      TogglButton.$curEntryId = entryId;
    });
    xhr.send(JSON.stringify(entry));
  },

  stopTimeEntry: function (entryId) {
    entryId = entryId || TogglButton.$curEntryId;
    if (!entryId) {
      return;
    }
    var xhr = new XMLHttpRequest();

    // PUT https://www.toggl.com/api/v8/time_entries/{time_entry_id}/stop
    xhr.open("PUT", TogglButton.$newApiUrl + "/time_entries/" + entryId + "/stop", true);
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(TogglButton.$user.api_token + ':api_token'));
    xhr.send();
  },

  createNewTask: function (description, wid, pid, callback) {
    var estimation = description.match(/(\d+)(min|h|d|wk)/),
        xhr = new XMLHttpRequest();
    estimation = estimation[0];

    if (estimation.indexOf('min') !== -1) {
      estimation = estimation.replace('min', '');
      estimation = estimation * 60;
    } else if (estimation.indexOf('h') !== -1) {
      estimation = estimation.replace('h', '');
      estimation = estimation * 3600;
    } else if (estimation.indexOf('d') !== -1) {
      estimation = estimation.replace('d', '');
      estimation = estimation * 86400;
    } else {
      estimation = estimation.replace('wk', '');
      estimation = estimation * 604800;
    }

    description = description.replace(/\s\[(\d+)(min|h|d|wk)\]\s\|\s(\d+)$/, '');
  
    var tid = null,
      apiToken,
      entry = {
        task: {
          name: description,
          wid: wid,
          pid: pid,
          estimated_seconds: estimation
        }
      };

    chrome.storage.sync.get({
          savedAdminAccessToken: '',
        }, function(items) {
          for (var property in TogglButton.$user.workspaces) {
            if (TogglButton.$user.workspaces[property].name === 'Despark' && TogglButton.$user.workspaces[property].admin === false) {
              apiToken = items.savedAdminAccessToken;
            }
            else {
              apiToken = TogglButton.$user.api_token;
            }
          }
          xhr.open("POST", TogglButton.$newApiUrl + "/tasks", true);
          xhr.setRequestHeader('Authorization', 'Basic ' + btoa(apiToken + ':api_token'));

          // handle response
          xhr.addEventListener('load', function (e) {
            if (xhr.status === 200) {
              var responseData, taskId;
              responseData = JSON.parse(xhr.responseText);
              taskId = responseData && responseData.data && responseData.data.id;
              TogglButton.$curTaskId = taskId;
              callback(TogglButton.$curTaskId);
            } else {
              alert(xhr.responseText);
            }
          });
          xhr.send(JSON.stringify(entry)); 
        });
  },

  saveTaskToDatabase: function (description, pid, tid) {
    description = description.replace(/\s\[(\d+)(min|h|d|wk)\]\s\|\s(\d+)$/, '');
    var xhr = new XMLHttpRequest(),
    entry = "description="+description+"&pid="+pid+"&tid="+tid;
    xhr.open("POST", TogglButton.$databaseUrl + "/insert.php", true);
    xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function() {
      if (xhr.readyState == XMLHttpRequest.DONE) {
          return xhr.responseText;
      }
    }
    xhr.send(entry); 
  },

  checkIfTaskExistsInDatabase: function (description, pid, callback) {
    description = description.replace(/\s\[(\d+)(min|h|d|wk)\]\s\|\s(\d+)$/, '');
    var xhr = new XMLHttpRequest(),
    entry = "description="+description+"&pid="+pid;
    xhr.open("POST", TogglButton.$databaseUrl + "/select.php", true);
    xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function() {
      if (xhr.readyState == XMLHttpRequest.DONE) {
          callback(xhr.responseText);
      }
    }
    xhr.send(entry);
  },

  //Create a New Project
  createNewProject: function (projectName,timeEntry) {

    var xhr = new XMLHttpRequest();
    var project_data = {
          project: {
            name: projectName,
            wid: TogglButton.$user.default_wid
          }
    };

    //POST https://www.toggl.com/api/v8/projects
    xhr.open("POST", TogglButton.$newApiUrl + "/projects", true);
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(TogglButton.$user.api_token + ':api_token'));

    // handle response
    xhr.addEventListener('load', function (e) {
      var responseData, projectId;
      responseData = JSON.parse(xhr.responseText);
      projectId = responseData && responseData.data && responseData.data.id;

      if(projectId == null || projectId == undefined){
        projectId = 0;
      }

      TogglButton.$user.projectMap[projectName] = projectId;

      TogglButton.createTimeEntry(timeEntry);

    });
    xhr.send(JSON.stringify(project_data));
  },

  setPageAction: function (tabId) {
    var imagePath = 'images/inactive-19.png';
    if (TogglButton.$user !== null) {
      imagePath = 'images/active-19.png';
    }
    chrome.pageAction.setIcon({
      tabId: tabId,
      path: imagePath
    });
    chrome.pageAction.show(tabId);
  },

  newMessage: function (request, sender, sendResponse) {
    if (request.type === 'activate') {
      TogglButton.setPageAction(sender.tab.id);
      sendResponse({success: TogglButton.$user !== null, user: TogglButton.$user});
    } else if (request.type === 'timeEntry') {
      TogglButton.createTimeEntry(request);
    } else if (request.type === 'stop') {
      TogglButton.stopTimeEntry();
    } else if (request.type === 'get_user_data') {
      sendResponse({user: TogglButton.$user});
    }
  }
};

chrome.pageAction.onClicked.addListener(function (tab) {
  if (TogglButton.$user === null) {
    chrome.tabs.create({url: 'https://toggl.com/login'});
  }
});

TogglButton.fetchUser(TogglButton.$apiUrl);
chrome.tabs.onUpdated.addListener(TogglButton.checkUrl);
chrome.extension.onMessage.addListener(TogglButton.newMessage);
