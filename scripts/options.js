// Saves options to chrome.storage
function save_options() {
  var togglAdminAccessToken = document.getElementById('toggl-admin-access-token').value,
      trelloDesparkId = document.getElementById('trello-despark-id').value,
      trelloApiKey = document.getElementById('trello-api-key').value,
      trelloAuthToken = document.getElementById('trello-auth-token').value;
  // save admin api token to local storage so that it can be accessed from background.js
  chrome.storage.sync.set({
    savedTogglAdminAccessToken: togglAdminAccessToken,
    savedTrelloDesparkId: trelloDesparkId,
    savedTrelloApiKey: trelloApiKey,
    savedTrelloAuthToken: trelloAuthToken
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Information saved!';
    setTimeout(function() {
      status.textContent = '';
    }, 5000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    savedTogglAdminAccessToken: '',
    savedTrelloDesparkId: '',
    savedTrelloApiKey: '',
    savedTrelloAuthToken: '',
  }, function(items) {
    document.getElementById('toggl-admin-access-token').value = items.savedTogglAdminAccessToken;
    document.getElementById('trello-despark-id').value = items.savedTrelloDesparkId;
    document.getElementById('trello-api-key').value = items.savedTrelloApiKey;
    document.getElementById('trello-auth-token').value = items.savedTrelloAuthToken;

  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);