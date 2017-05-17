/*jslint indent: 2 */
/*global document: false, MutationObserver: false, chrome: false*/
"use strict";

var isStarted = false;

function $(s, elem) {
  elem = elem || document;
  return elem.querySelector(s);
}


function createTag(name, className, innerHTML, nameParam) {
  var tag = document.createElement(name);
  tag.className = className;
  tag.id = nameParam;
  tag.name = nameParam;

  if (innerHTML) {
    tag.innerHTML = innerHTML;
  }

  return tag;
}

function createLink(className, tagName, linkHref) {
  var link;
  var label;

  // Param defaults
  tagName  = tagName  || 'a';
  linkHref = linkHref || '#';
  link     = createTag(tagName, className);

  if (tagName === 'a') {
    link.href = linkHref;
  }


  if (isStarted) {
    label = 'Stop timer';
  } else {
    label = 'Start timer';
  }

  link.appendChild(document.createTextNode(label));
  return link;
}

function getCardId() {
  var slug = document.URL.substring(document.URL.lastIndexOf('/') + 1),
  card_id = slug.substring(0, slug.indexOf('-'));

  return card_id;
}

function checkForActiveTimeEntry (callback) {
  var xhr = new XMLHttpRequest();
  var newApiUrl = "https://www.toggl.com/api/v8";
  xhr.open("GET", newApiUrl + "/time_entries/current", true);

  // handle response
  xhr.addEventListener('load', function (e) {
    if (xhr.status === 200) {
      var responseData;
      var cardId = getCardId();
      var currentTask = $('.card-detail-title-assist').innerText.trim() + " | " + cardId;
      responseData = JSON.parse(xhr.responseText);
      if (responseData.data !== null) {
        if (currentTask.match(responseData.data.description) !== null) {
          callback(true);
        }
      }
    } else {
      alert('Cannot get if there is an active time entry! Please check if you are signed in Toggl!');
    }        
  });
  xhr.send(); 
}

function convertTime(time) {
  var hours = parseInt(time / 3600);
  var minutes = parseInt(time / 60) % 60;
  var seconds = time % 60;

  var result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds  < 10 ? "0" + seconds : seconds);

  return result;
}

function invokeIfFunction(trial) {
  if (trial instanceof Function) {
    return trial();
  }
  return trial;
}

var togglbutton = {
  isStarted: false,
  user: false,
  label: 'Start timer',
  render: function (selector, opts, renderer) {
    chrome.extension.sendMessage({type: 'activate'}, function (response) {
      if (response.success) {
        if (opts.observe) {
          var observer = new MutationObserver(function (mutations) {
            togglbutton.renderTo(selector, renderer);
          });
          observer.observe(document, {childList: true, subtree: true});
        } else {
          togglbutton.renderTo(selector, renderer);
        }
      }
    });
  },

  get_user_data: function () {
    var response_up = chrome.extension.sendMessage({type: 'get_user_data'}, function (response) {
      return response;
    });

    return response_up;
  },

  renderTo: function (selector, renderer) {
    var i, len, elems = document.querySelectorAll(selector);
    for (i = 0, len = elems.length; i < len; i += 1) {
      elems[i].classList.add('toggl');
    }
    for (i = 0, len = elems.length; i < len; i += 1) {
      renderer(elems[i]);
    }
  },

  createTimerLink: function (params) {
    var link = createLink('toggl-button');
    link.classList.add(params.className);

    if (params.buttonType === 'minimal') {
      link.classList.add('min');
      link.removeChild(link.firstChild);
    }

    if (params.description.match(/\[(bug)\]/ig) !== null) {
        params.tags = ["Bug"];
    }

    link.addEventListener('click', function (e) {
      var opts, linkText, color = '';
      e.preventDefault();

      var e = document.getElementById("toggl_projects_select");
      var e2 = document.getElementById("toggl_workspaces_select");

      var projectId = e.options[e.selectedIndex].value;
      // var projectName = e.options[e.selectedIndex].innerText;
      var projectName = e.options[e.selectedIndex].dataset.projectName;

      var workspaceId = e2.options[e2.selectedIndex].value;
      var workspaceName = e2.options[e2.selectedIndex].innerText;
      //var workspaceName = e2.options[e2.selectedIndex].workspaceName;

      if (! projectId || projectId == 'default') {
        alert('Please select a project from the dropdown in the board header and try again.')
      }
      else if (! workspaceId || workspaceId == 'default') {
        alert('Please select a workspace from the dropdown in the board header and try again.')
      }
      else {
        if (isStarted) {
          link.classList.remove('active');
          linkText = 'Start timer';
          opts = {type: 'stop'};
        } else {
          link.classList.add('active');
          color = '#1ab351';
          linkText = 'Stop timer';
          opts = {
            type: 'timeEntry',
            projectId: projectId,
            workspaceId: workspaceId,
            description: invokeIfFunction(params.description),
            projectName: projectName,
            workspaceName: workspaceName,
            createdWith: 'TogglButton - ' + params.className,
            tags: params.tags
          };
        }
        chrome.extension.sendMessage(opts);
        isStarted = !isStarted;
        link.style.color = color;
        if (params.buttonType !== 'minimal') {
          link.innerHTML = linkText;
        }
      }

      return false;
    });

    // new button created - reset state
    checkForActiveTimeEntry(function (active) {
      if (active) {
        isStarted = true;
      }
    });
    
    return link;
  },

  createEstimationDiv: function (userData) {
    var tag = createTag("div", "toggl-button-estimations", taskEstimationTimeLeft(userData), null);
    return tag;
  },

  createUserTimeTrackedDiv: function (userData) {
    var tag = createTag("div", "toggl-button-estimations", userTaskTrackedTime(userData), null);
    return tag;
  },

  createTotalTimeTrackedDiv: function (userData) {
    var tag = createTag("div", "toggl-button-estimations", totalTaskTrackedTime(userData), null);
    return tag;
  }
};



var createOption = function (id, cid, clientName, projectName, workspaceName, selected) {
  var text = '', option = document.createElement("option");
  option.setAttribute("value", id);
  option.setAttribute("data-client-id", cid);
  if (selected) {
    option.setAttribute('selected', 'selected');
  }

  if (clientName) {
    text = clientName + ' - ';
  }
  
  if (projectName) {
    option.setAttribute("data-project-name", projectName);
    option.text = text + projectName;
  }
  if (clientName) {
    option.setAttribute("data-client-name", clientName);
  }
  if (workspaceName) {
    option.setAttribute("data-worksapce-name", workspaceName);
    option.text = text + workspaceName;
  }

  return option;
}

var createProjectSelect = function (userData, className, nameParam) {
  var clients, projectLabel, option, select = createTag('select', className, false, nameParam);
  var currentBoardName = $('.board-header > a').innerText.trim().replace(/(^\d+\s\-\s|\s)/g,'').toLowerCase();;

  //add  an empty (default) option
  select.appendChild(createOption("default", null, false, "-= Select a toggl project =-"));

  userData.projects.forEach(function (project) {
    clients = userData.clients.filter(function (elem, index, array) { return (elem.id === project.cid); });
    var projectLabel = project.name;
    var projectLabelTrimmed = project.name.trim().replace(/(^\d+\s\-\s|\s)/g,'').toLowerCase();
    
    var selected = false;
    if (projectLabelTrimmed.indexOf(currentBoardName) !== -1)
      selected = true;

    select.appendChild(createOption(project.id, project.cid, (clients[0] !== undefined && clients[0].name != '' ? clients[0].name : false), projectLabel, false, selected));
  });

  return select;
}

var createWorkspaceSelect = function (userData, className, nameParam) {
  var option, select = createTag('select', className, false, nameParam);
  var currentOrganizationName = $('.board-header-btn-org-name > span').innerText.trim();

  //add  an empty (default) option
  select.appendChild(createOption("default", null, false, "-= Select a toggl workspace =-"));

  userData.workspaces.forEach(function (workspace) {
    var selected = false;
    if (currentOrganizationName.match(workspace.name) !== null) {
      selected = true;
    }
    select.appendChild(createOption(workspace.id, null, false, false, workspace.name, selected));
  });

  return select;
}

var taskEstimationTimeLeft = function (userData) {
  var timeLeft = 0,
      estimatedSeconds = 0,
      trackedSeconds = 0;
  var currentTask = $('.card-detail-title-assist').innerText.trim();
  var cardId = getCardId();
  var currentTaskStripped = currentTask.replace(/\s\[(\d+)(min|h|d|wk)\]/, '') + ' | ' + cardId;

  userData.tasks.forEach(function (task) {
    // if (currentTaskStripped.indexOf(task.name.replace(/\s\|\s(\d+)$/, "")) === 0) {
    if (currentTaskStripped.indexOf(task.name) === 0) {
    //if (currentTaskStripped.match(task.name.replace(/\s\|\s(\d+)$/, "")) !== null) {
        estimatedSeconds = task.estimated_seconds;
        trackedSeconds = task.tracked_seconds;
    }
  });
  if (estimatedSeconds !== 0) {
    if (estimatedSeconds >= trackedSeconds) {
      timeLeft = estimatedSeconds - trackedSeconds;
      return 'Left: ' + convertTime(timeLeft);
    } else {
      timeLeft = trackedSeconds - estimatedSeconds;
      return 'Overdone: ' + convertTime(timeLeft);
    }
  } else {
    if (currentTask.match(/\s\[(\d+)(min|h|d|wk)\]/) !== null) {
      timeLeft = currentTask.match(/\s\[(\d+)(min|h|d|wk)\]/);
      timeLeft = timeLeft[1] + timeLeft[2]
      
      if (timeLeft.indexOf('min') !== -1) {
        timeLeft = timeLeft.replace('min', '');
        timeLeft = timeLeft * 60;
      } else if (timeLeft.indexOf('h') !== -1) {
        timeLeft = timeLeft.replace('h', '');
        timeLeft = timeLeft * 3600;
      } else if (timeLeft.indexOf('d') !== -1) {
        timeLeft = timeLeft.replace('d', '');
        timeLeft = timeLeft * 86400;
      } else {
        timeLeft = timeLeft.replace('wk', '');
        timeLeft = timeLeft * 604800;
      }
      return 'Left: ' + convertTime(timeLeft);
    } else {
      return 'No Estimation';
    }
  }
}

var userTaskTrackedTime = function (userData) {
  var  cardId = getCardId();
  var totalUserTaskTrackedTime = 0;
  var timeEntryDescription;
  var currentTask = $('.card-detail-title-assist').innerText.trim();
  currentTask = currentTask.replace(/\s\[(\d+)(min|h|d|wk)\]/, '')  + ' | ' + cardId;

  userData.time_entries.forEach(function (time_entry) {
    if (typeof time_entry.description !== 'undefined') {
      if (time_entry.description.match(/\s\[(\d+)(min|h|d|wk)\]/) !== null) {
        timeEntryDescription = time_entry.description.replace(/\s\[(\d+)(min|h|d|wk)\]/, '');
      } else {
        timeEntryDescription = time_entry.description;
      }

      if (currentTask.indexOf(timeEntryDescription) === 0) {
      //if (currentTask.match(timeEntryDescription) !== null) {
        if (time_entry.duration >= 0) {
          totalUserTaskTrackedTime += time_entry.duration;
        }
      }
    } 
  });
  return 'Me: ' + convertTime(totalUserTaskTrackedTime);
}

var totalTaskTrackedTime = function (userData) {
  var cardId = getCardId();
  var totalTaskTrackedTime = 0;
  var timeEntryDescription;
  var currentTask = $('.card-detail-title-assist').innerText.trim();
  currentTask = currentTask.replace(/\s\[(\d+)(min|h|d|wk)\]/, '')  + ' | ' + cardId;

  userData.tasks.forEach(function (task) {
    if (currentTask.indexOf(task.name) === 0) {
    // if (currentTask.indexOf(task.name.replace(/\s\|\s(\d+)$/, "")) === 0) {
    //if (currentTask.match(task.name.replace(/\s\|\s(\d+)$/, "")) !== null) {
        totalTaskTrackedTime = task.tracked_seconds;
    }
  });

  return 'Worked: ' + convertTime(totalTaskTrackedTime);
}