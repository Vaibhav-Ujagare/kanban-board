document.addEventListener("DOMContentLoaded", loadTasksFromLocalStorage);

function saveBoardsToLocalStorage(colId, boardCreationDate) {
  const boards = [];
  boards.push({ colId: colId, boardCreationDate: boardCreationDate });
  localStorage.setItem(colId, JSON.stringify(boards));
}

const allBoards = document.querySelectorAll(".tasks");
allBoards.forEach((board) => {
  board.addEventListener("dragover", dragOver);
});

function dragOver(event) {
  event.preventDefault();
  const draggedElement = document.querySelector(".dragging");
  const afterElement = getDragAfterElement(this, event.pageY);
  if (afterElement === null) {
    this.appendChild(draggedElement);
  } else {
    this.insertBefore(draggedElement, afterElement);
  }
}

function getDragAfterElement(card, y) {
  const draggableElements = [...card.querySelectorAll(".card:not(.dragging)")];
  const result = draggableElements.reduce(
    (closestElementUnderMouse, currentTask) => {
      const box = currentTask.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closestElementUnderMouse.offset) {
        return { offset: offset, element: currentTask };
      } else {
        return closestElementUnderMouse;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  );
  return result.element;
}

function addTask(colId) {
  const input = document.getElementById(`${colId}-input`);
  const taskText = input.value.trim();

  if (taskText === "") return;

  // Generate a unique ID for the task
  const cardId = crypto.randomUUID(); // Generates a persistent unique ID

  const taskElement = createTaskElement(
    taskText,
    colId,
    cardId,
    new Date().toLocaleString()
  );
  document.getElementById(`${colId}-tasks`).appendChild(taskElement);

  updateTasksCount(colId);

  // Save task to localStorage with the unique ID
  saveTasksToLocalStorage(colId, cardId, taskText, new Date().toLocaleString());

  input.value = "";
}

function saveTasksToLocalStorage(colId, cardId, taskText, taskDate) {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  // Check if task already exists
  let task = tasks.find((t) => t.id === cardId);

  if (!task) {
    // If task is new, add it
    task = {
      id: cardId,
      text: taskText,
      history: [],
    };
    tasks.push(task);
  }

  // Add history entry
  task.history.push({
    board: colId,
    time: taskDate || new Date().toLocaleString(),
  });

  // Save back to localStorage
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasksFromLocalStorage() {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  // ✅ Clear all boards to prevent duplicate rendering
  document
    .querySelectorAll(".tasks")
    .forEach((board) => (board.innerHTML = ""));

  // ✅ Track which tasks have been added already (to prevent duplicates)
  let renderedTaskIds = new Set();

  tasks.forEach((task) => {
    let lastBoard = task.history[task.history.length - 1].board; // Get the most recent board
    let lastUpdatedTime = null;
    task.history.forEach((record) => {
      console.log(record.time);
      lastUpdatedTime = record.time;
    });
    // ✅ Ensure the task is not added multiple times
    if (!renderedTaskIds.has(task.id)) {
      const taskElement = createTaskElement(
        task.text,
        lastBoard,
        task.id,
        lastUpdatedTime
      );
      document.getElementById(`${lastBoard}-tasks`).appendChild(taskElement);
      renderedTaskIds.add(task.id);
    }
  });

  // ✅ Ensure all task counts are updated correctly
  updateAllTaskCounts();
}

function updateLocalStorage() {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  document.querySelectorAll(".board .tasks").forEach((board) => {
    const colId = board.id.replace("-tasks", "");

    board.querySelectorAll(".card").forEach((task) => {
      const cardId = task.getAttribute("data-id");
      const newText = task.querySelector("p").textContent;
      let existingTask = tasks.find((t) => t.id === cardId);
      if (existingTask) {
        // ✅ Fetch the last recorded time instead of overwriting
        existingTask.text = newText;
        let lastHistoryEntry =
          existingTask.history.length > 0
            ? existingTask.history[existingTask.history.length - 1]
            : null;

        console.log(lastHistoryEntry);
        console.log(
          "🕒 Keeping Last Timestamp:",
          lastHistoryEntry ? lastHistoryEntry.time : "N/A"
        );

        existingTask.history.push({
          board: colId,
          time: lastHistoryEntry.time, // Preserve the last timestamp
        });
      } else {
        // If it's a completely new task, add it with the correct timestamp
        tasks.push({
          id: cardId,
          text: text,
          history: [
            {
              board: colId,
              time: new Date().toLocaleString(),
            },
          ],
        });
      }
    });
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function createTaskElement(taskText, colId, cardId, taskAddedDate) {
  const taskElement = document.createElement("div");
  taskElement.classList.add("card");
  taskElement.setAttribute("draggable", true);
  taskElement.setAttribute("data-id", cardId);

  const textContainer = document.createElement("div");
  textContainer.classList.add("task-container");

  const textDiv = document.createElement("div");
  textDiv.classList.add("task-text");

  const textElement = document.createElement("p");
  textElement.innerText = taskText;

  const dateElement = document.createElement("small");
  dateElement.innerText = `Added to ${colId}: ${taskAddedDate}`;

  const actionContainer = document.createElement("div");
  actionContainer.classList.add("task-actions");

  const editButton = document.createElement("button");
  editButton.classList.add("edit-task");
  editButton.innerText = "Edit";

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-task");
  deleteButton.innerText = "Delete";

  const cardIdElement = document.createElement("small");
  cardIdElement.classList.add("card-id");
  cardIdElement.innerText = Date.now();

  editButton.addEventListener("click", function () {
    const newText = prompt("Enter new text", textElement.textContent);
    if (newText && newText !== textElement.textContent) {
      textElement.textContent = newText;
      updateLocalStorage(cardIdElement.innerText, colId);
    }
  });

  deleteButton.addEventListener("click", function () {
    const cardId = taskElement.getAttribute("data-id");
    taskElement.remove();
    updateTasksCount(colId);
    removeTaskFromLocalStorage(cardId);
  });

  taskElement.addEventListener("dragstart", dragStart);
  taskElement.addEventListener("dragend", dragEnd);

  textDiv.appendChild(textElement);
  textContainer.appendChild(textDiv);
  textContainer.appendChild(dateElement);
  taskElement.appendChild(textContainer);
  actionContainer.appendChild(editButton);
  actionContainer.appendChild(deleteButton);
  taskElement.appendChild(actionContainer);
  taskElement.appendChild(cardIdElement);

  return taskElement;
}

function dragEnd() {
  this.classList.remove("dragging");

  const newBoardId = this.parentElement.id.replace("-tasks", ""); // Get the new board ID
  const cardId = this.getAttribute("data-id"); // Get the card ID

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  // Find the existing task
  let taskIndex = tasks.findIndex((task) => task.id === cardId);

  if (taskIndex !== -1) {
    let task = tasks[taskIndex];
    console.log(task);
    // ✅ Get last recorded time from history
    let lastHistoryEntry =
      task.history.length > 0 ? task.history[task.history.length - 1] : null;

    // ✅ Only push new history entry if board actually changed
    let lastBoard = lastHistoryEntry ? lastHistoryEntry.board : null;
    console.log(lastHistoryEntry.time);
    if (lastBoard !== newBoardId) {
      task.history.push({
        board: newBoardId,
        time: new Date().toLocaleString(), // Use last recorded time or fallback
      });
    }

    // ✅ Update the UI timestamp directly on the moved task
    const dateElement = this.querySelector("small");
    if (dateElement) {
      dateElement.innerText = `Added to ${newBoardId}: ${
        lastHistoryEntry ? lastHistoryEntry.time : "N/A"
      }`;
    }

    localStorage.setItem("tasks", JSON.stringify(tasks));

    // ✅ Update counts for all boards
    updateAllTaskCounts();
  }
}

function dragStart() {
  this.classList.add("dragging");
}

function removeTaskFromLocalStorage(cardId) {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks = tasks.filter((task) => task.id !== cardId);
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function updateTasksCount(colId) {
  // Get the number of cards inside the board
  const tasksCount = document.querySelectorAll(`#${colId}-tasks .card`).length;

  // Update the count display
  const countElement = document.getElementById(`${colId}-count`);
  if (countElement) {
    countElement.textContent = tasksCount;
  }
}
function updateAllTaskCounts() {
  document.querySelectorAll(".board .tasks").forEach((board) => {
    const colId = board.id.replace("-tasks", "");
    updateTasksCount(colId);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("contextmenu", function (event) {
    event.preventDefault(); // Prevent the default context menu

    const card = event.target.closest(".card"); // Get the card element
    if (!card) return;

    const cardId = card.getAttribute("data-id");
    showCardHistory(cardId, event.pageX, event.pageY);
  });
});

function showCardHistory(cardId, x, y) {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let task = tasks.find((t) => t.id === cardId);

  if (!task) return;

  // Create or update the history popup
  let historyPopup = document.getElementById("history-popup");
  if (!historyPopup) {
    historyPopup = document.createElement("div");
    historyPopup.id = "history-popup";
    historyPopup.style.position = "absolute";
    historyPopup.style.background = "white";
    historyPopup.style.border = "1px solid black";
    historyPopup.style.padding = "10px";
    historyPopup.style.borderRadius = "5px";
    historyPopup.style.boxShadow = "0px 0px 5px rgba(0,0,0,0.3)";
    historyPopup.style.zIndex = "1000";
    document.body.appendChild(historyPopup);
  }

  historyPopup.innerHTML = `<strong>History:</strong><br>`;
  task.history.forEach((entry, index) => {
    historyPopup.innerHTML += `${index + 1}. Moved to <b>${
      entry.board
    }</b> at <i>${entry.time}</i><br>`;
  });

  // Position the popup near the cursor
  historyPopup.style.left = `${x}px`;
  historyPopup.style.top = `${y}px`;

  // Hide the popup when clicking anywhere
  document.addEventListener(
    "click",
    () => {
      historyPopup.remove();
    },
    { once: true }
  );
}
