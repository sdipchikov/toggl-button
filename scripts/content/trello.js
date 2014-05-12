/*jslint indent: 2 */
/*global $: false, document: false, togglbutton: false, createTag:false*/

'use strict';
var userData = false;

togglbutton.render('.board-header:not(.toggl)', {observe: true}, function (elem) {
  chrome.extension.sendMessage({type: 'get_user_data'}, function (response) {
    elem.appendChild(createProjectSelect(response.user, 'toggl-projects-select', 'toggl_projects_select'));
  });
});

togglbutton.render('.window-header:not(.toggl)', {observe: true}, function (elem) {
  var link, container = createTag('div', 'card-detail-item clear'),
    titleElem = $('.window-title-text', elem),
    // projectElem = $('.board-header > a'),
    projectElem = $('#toggl_projects_select'),
    descriptionElem = $('.card-detail-item-block');

  link = togglbutton.createTimerLink({
    className: 'trello',
    description: titleElem.innerText,
    projectName: ''
  });

  container.appendChild(link);
  descriptionElem.parentNode.insertBefore(container, descriptionElem);
});

/* Checklist buttons */
togglbutton.render('.checklist-item-details:not(.toggl)', {observe: true}, function (elem) {
  var link,
    // projectElem = $('.board-header > a'),
    projectElem = $('#toggl_projects_select'),
    titleElem = $('.window-title-text'),
    taskElem = $('.checklist-item-details-text', elem);

  link = togglbutton.createTimerLink({
    className: 'trello',
    buttonType: 'minimal',
    projectName: '',
    description: titleElem.innerText + ' - ' + taskElem.innerText,
  });

  link.classList.add('checklist-item-button');
  elem.parentNode.appendChild(link);
});

