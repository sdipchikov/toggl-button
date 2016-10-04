// Saves options to chrome.storage
function save_options() {
  var adminAccessToken = document.getElementById('admin-access-token').value;
  // save admin api token to local storage so that it can be accessed from background.js
  chrome.storage.sync.set({
    savedAdminAccessToken: adminAccessToken
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'API Token Saved!';
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
    savedAdminAccessToken: '',
  }, function(items) {
    document.getElementById('admin-access-token').value = items.savedAdminAccessToken;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);