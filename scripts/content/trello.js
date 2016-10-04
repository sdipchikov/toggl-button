/*jslint indent: 2 */
/*global $: false, document: false, togglbutton: false, createTag:false*/

'use strict';
var userData = false;

togglbutton.render('.board-header:not(.toggl)', {observe: true}, function (elem) {
  chrome.extension.sendMessage({type: 'get_user_data'}, function (response) {
    elem.appendChild(createWorkspaceSelect(response.user, 'toggl-select', 'toggl_workspaces_select'));
    elem.appendChild(createProjectSelect(response.user, 'toggl-select', 'toggl_projects_select'));
  });
});

togglbutton.render('.window-header:not(.toggl)', {observe: true}, function (elem) {
  var link, container = createTag('div', 'card-detail-item clear'),
    titleElem = $('.window-title h2', elem),
    // projectElem = $('.board-header > a'),
    projectElem = $('#toggl_projects_select'),
    descriptionElem = $('.card-detail-item-block'),
    slug = document.URL.substring(document.URL.lastIndexOf('/') + 1),
    card_id = slug.substring(0, slug.indexOf('-'));

  var labelsContainer = $('.js-card-detail-labels-list').getElementsByClassName('card-label');
  labelsContainer = Array.prototype.slice.call(labelsContainer);
  var tags = [];
  var i = '';

  for (i in labelsContainer) {
    if (labelsContainer[i].title.indexOf('bug') > -1 || labelsContainer[i].title.indexOf('fix') > -1)
    {
      tags.push('bugfix');
    }
  }

  link = togglbutton.createTimerLink({
    className: 'trello',
    description: titleElem.innerHTML + ' | ' + card_id,
    projectName: '',
    tags: tags,
    cardId: card_id,
  });
  container.appendChild(link);

  var xhr = new XMLHttpRequest();
  xhr.open("GET", "https://www.toggl.com/api/v8/me?with_related_data=true", true);
  xhr.addEventListener('load', function (e) {
    if (xhr.status === 200) {
      var responseData;
      responseData = JSON.parse(xhr.responseText);
      var timeTrackedDiv = togglbutton.createTimeTrackedDiv(responseData.data);
      var estimationDiv = togglbutton.createEstimationDiv(responseData.data);
      container.appendChild(timeTrackedDiv);
      container.appendChild(estimationDiv);
    } else {
      alert(responseData);
    }        
  });
  xhr.send(); 
  descriptionElem.parentNode.insertBefore(container, descriptionElem);
});

/* Checklist buttons */
togglbutton.render('.checklist-item-details:not(.toggl)', {observe: true}, function (elem) {
  var link,
    // projectElem = $('.board-header > a'),
    projectElem = $('#toggl_projects_select'),
    titleElem = $('.window-title h2'),
    taskElem = $('.checklist-item-details-text', elem),
    slug = document.URL.substring(document.URL.lastIndexOf('/') + 1),
    card_id = slug.substring(0, slug.indexOf('-'));

  var labelsContainer = $('.js-card-detail-labels-list').getElementsByClassName('card-label');
  labelsContainer = Array.prototype.slice.call(labelsContainer);
  var tags = [];
  var i = '';

  for (i in labelsContainer) {
    if (labelsContainer[i].title.indexOf('bug') > -1 || labelsContainer[i].title.indexOf('fix') > -1)
    {
      tags.push('bugfix');
    }
  }

  link = togglbutton.createTimerLink({
    className: 'trello',
    buttonType: 'minimal',
    projectName: '',
    description: titleElem.innerText + ' - ' + taskElem.innerText + ' | ' + card_id,
    tags: tags,
    cardId: card_id,
  });

  link.classList.add('checklist-item-button');
  elem.parentNode.appendChild(link);
});

