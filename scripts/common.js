/*jslint indent: 2 */
/*global document: false, MutationObserver: false, chrome: false*/
"use strict";

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

  // Param defaults
  tagName  = tagName  || 'a';
  linkHref = linkHref || '#';
  link     = createTag(tagName, className);

  if (tagName === 'a') {
    link.href = linkHref;
  }

  link.appendChild(document.createTextNode('Start timer'));
  return link;
}

function convertTime(time) {
  if (time > 60) {
    time = time / 3600;
    if (time < 1) {
      time = time * 60;
      time = time.toFixed(2);
      time = time + 'min';
    } else {
      time = time.toFixed(2);
      time = time + 'h';
    }
  } else {
    time = time + 's';
  }
  return time;
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
        if (this.isStarted) {
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
        this.isStarted = !this.isStarted;
        link.style.color = color;
        if (params.buttonType !== 'minimal') {
          link.innerHTML = linkText;
        }
      }

      return false;
    });

    // new button created - reset state
    this.isStarted = false;
    return link;
  },

  createEstimationDiv: function (userData) {
    var tag = createTag("div", "toggl-button-estimations", taskEstimationTimeLeft(userData), null);
    return tag;
  },

  createTimeTrackedDiv: function (userData) {
    var tag = createTag("div", "toggl-button-estimations", userTaskTrackedTime(userData), null);
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
  var currentBoardName = $('.board-header > a').innerText.trim();

  //add  an empty (default) option
  select.appendChild(createOption("default", null, false, "-= Select a toggl project =-"));

  userData.projects.forEach(function (project) {
    clients = userData.clients.filter(function (elem, index, array) { return (elem.id === project.cid); });
    var projectLabel = project.name;
    var projectLabelTrimmed = project.name.trim();

    var selected = false;
    if (projectLabelTrimmed == currentBoardName)
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
  var timeLeft = 0;
  var currentTask = $('.card-detail-title-assist').innerText.trim();
  currentTask = currentTask.replace(/\s\[(\d+)(min|h|d|wk)\]/, '');

  userData.tasks.forEach(function (task) {
    if (currentTask.match(task.name) !== null) {
      timeLeft = task.estimated_seconds - task.tracked_seconds;
    }
  });
  return 'Left: ' + convertTime(timeLeft);
}

var userTaskTrackedTime = function (userData) {
  var totalUserTaskTrackedTime = 0;
  var currentTask = $('.card-detail-title-assist').innerText.trim();
  currentTask = currentTask.replace(/\s\[(\d+)(min|h|d|wk)\]/, '');

  userData.time_entries.forEach(function (time_entry) {
    if (time_entry.description.match(/\s\[(\d+)(min|h|d|wk)\]/) !== null) {
      time_entry.description = time_entry.description.replace(/\s\[(\d+)(min|h|d|wk)\]\s\|\s(\d+)$/, '');
    } else if (time_entry.description.match(/\s\|\s(\d+)$/) !== null) {
      time_entry.description = time_entry.description.replace(/\s\|\s(\d+)$/, '');
    } else {}

    if (currentTask.match(time_entry.description) !== null) {
      totalUserTaskTrackedTime += time_entry.duration;
    }
  });
  return 'Worked: ' + convertTime(totalUserTaskTrackedTime);
}
