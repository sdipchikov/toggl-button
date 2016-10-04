# Toggl Button Chrome extension

Add Toggl one-click time tracking to Trello.

Other services will potentially be implemented in the future.

## Compatible services
  - [Trello][2]

## Installing from Source

1.  Clone the repository: `git git@github.com:sdipchikov/toggl-button.git`
2.  Navigate to `chrome://extensions/` and enable "Developer Mode".
3.  Choose "Load unpacked extension..."
4.  Open the directory you just cloned and follow the prompts to install.

## Using the Button
1.  Log in to your [Toggl][1] account and keep yourself logged in (no need to keep the tab open).
2. 	Right click on the Toggl Button extension and select the Options tab.
3.	Fill up the blanks with appropriate data.
4.	Make a MySQL Database with a table called tasks and columns: id, description, pid, tid and trello_card_id.
5.	Make MySQL queries to the database. Check backend examples for more information.
6.  Go to your [Trello][2] account, select a workspace, project, Trello card and start your Toggl timer from there.
7.  To stop the current running timer:
  - press the button again
  - start another time entry inside your account.
  - go to Toggl to stop or edit your time entry.

## What this extension does
1. Creates time entries for tracking your work time.
2. Creates tasks for the selected project with/without an estimate. If your Trello card is called Login button [5h], it will create a task called Login button and giving it an estimate of 5 hours. You can use min for minutes, h for hours, d for days and wk for weeks. Remember that in Toggl estimates are always shown in hours! If you don't give an estimate (Login button), it will create only a new task without an estimate.
3. You can update your task's name or estimate by editing the Trello card, refreshing the page and clicking the Start button.
4. You can select different Projects and Workspaces.

[1]: https://www.toggl.com/
[2]: https://trello.com/

