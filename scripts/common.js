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
      var projectId = e.options[e.selectedIndex].value;
      // var projectName = e.options[e.selectedIndex].innerText;
      var projectName = e.options[e.selectedIndex].dataset.projectName;

      if (! projectId || projectId == 'default') {
        alert('Please select a project from the dropdown in the board header and try again.')
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
            description: invokeIfFunction(params.description),
            projectName: projectName,
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
  }
};

var createOption = function (id, cid, clientName, projectName, selected) {
  var text = '', option = document.createElement("option");
  option.setAttribute("value", id);
  option.setAttribute("data-client-id", cid);
  if (selected) {
    option.setAttribute('selected', 'selected');
  }

  if (clientName) {
    text = clientName + ' - ';
  }
  option.text = text + projectName;

  if (projectName) {
    option.setAttribute("data-project-name", projectName);
  }
  if (clientName) {
    option.setAttribute("data-client-name", clientName);
  }

  return option;
}

var createProjectSelect = function (userData, className, nameParam) {
  var clients, projectLabel, option, select = createTag('select', className, false, nameParam);
  var currentBoardName = $('.board-header > a').innerText;

  //add  an empty (default) option
  select.appendChild(createOption("default", null, false, "-= Select a toggl project =-"));

  userData.projects.forEach(function (project) {
    clients = userData.clients.filter(function (elem, index, array) { return (elem.id === project.cid); });
    projectLabel = project.name;

    var selected = false;
    if (projectLabel == currentBoardName)
      selected = true;

    select.appendChild(createOption(project.id, project.cid, (clients[0] !== undefined && clients[0].name != '' ? clients[0].name : false), projectLabel, selected));
  });

  return select;
}
