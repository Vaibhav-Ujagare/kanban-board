document.addEventListener("DOMContentLoaded", loadTasksFromLocalStorage);

function saveBoardsToLocalStorage(colId, boardCreationDate) {
  const boards = [];
  boards.push({ colId: colId, boardCreationDate: boardCreationDate });
  localStorage.setItem(colId, JSON.stringify(boards));
}

const addTaskButton = document.querySelector(".add-tasks");

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

  if (taskText === "") {
    return;
  }
  console.log(colId);
  const taskElement = createTaskElement(taskText, colId);

  document.getElementById(`${colId}-tasks`).appendChild(taskElement);
  updateTasksCount(colId);
  const taskDate = taskElement.querySelector("small").innerText;
  const cardId = taskElement.querySelector(".card-id").innerHTML;
  saveTasksToLocalStorage(colId, cardId, taskText, taskDate);

  input.value = "";
}

function saveTasksToLocalStorage(colId, cardId, taskText, taskDate) {
  const tasks = JSON.parse(localStorage.getItem(colId)) || [];
  tasks.push({
    id: cardId,
    text: taskText,
    date: taskDate || new Date().toLocaleString(),
  });
  localStorage.setItem(colId, JSON.stringify(tasks));
}

function loadTasksFromLocalStorage() {
  const keys = Object.keys(localStorage);

  keys.forEach((colId) => {
    let tasks = JSON.parse(localStorage.getItem(colId)) || [];

    tasks.forEach(({ text, date }) => {
      const taskElement = createTaskElement(text, colId);
      taskElement.querySelector("small").innerText = `${date} `;
      document.getElementById(`${colId}-tasks`).appendChild(taskElement);
    });

    updateTasksCount(colId);
  });
}

function updateLocalStorage() {
  const allBoards = document.querySelectorAll(".board .tasks");

  allBoards.forEach((board) => {
    const colId = board.id.replace("-tasks", "");
    const tasks = [];

    board.querySelectorAll(".card").forEach((task) => {
      const test = task.querySelectorAll("p");
      let allText = [];
      test.forEach((t) => {
        allText.push(t.innerHTML);
      });
      const cardId = task.querySelector(".card-id").innerHTML;
      const text = allText.join("");
      const date = task.querySelector("small").innerText;
      tasks.push({ cardId, text, date });
    });

    localStorage.setItem(colId, JSON.stringify(tasks));
    console.log("reached");
  });
}

function splitParagraph(text, chunkSize) {
  let words = text; // Split into words
  let result = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    result.push(words.slice(i, i + chunkSize)); // Join 30-word chunks
  }
  return result;
}

function createTaskElement(taskText, colId) {
  const taskElement = document.createElement("div");
  const textContainer = document.createElement("div");
  const actionContainer = document.createElement("div");
  const editButton = document.createElement("button");
  const deleteButton = document.createElement("button");
  const textDiv = document.createElement("div");
  const textElement = document.createElement("p");
  const dateElement = document.createElement("small");
  const cardId = document.createElement("small");

  textContainer.classList.add("task-container");
  textDiv.classList.add("task-text");
  actionContainer.classList.add("task-actions");
  editButton.classList.add("edit-task");
  deleteButton.classList.add("delete-task");
  taskElement.classList.add("card");
  cardId.classList.add("card-id");

  const todoAddedDate = new Date().toLocaleString();
  dateElement.innerText = `Task Added in ${colId}: ${todoAddedDate}`;

  textElement.innerText = taskText;
  editButton.innerText = "Edit";
  deleteButton.innerText = "Delete";
  cardId.innerHTML = Date.now();

  editButton.addEventListener("click", function () {
    const newText = prompt("Enter new text", textElement.textContent);

    if (!newText || newText === textElement.textContent) {
      return;
    }

    console.log(newText);
    textElement.textContent = newText;
    updateLocalStorage();
  });

  deleteButton.addEventListener("click", function () {
    const colId = taskElement.parentElement.id.replace("-tasks", "");
    taskElement.remove();
    updateTasksCount(colId);
    updateLocalStorage();
  });

  textElement.textContent = taskText;
  textDiv.appendChild(textElement);

  taskElement.setAttribute("draggable", true);
  cardId.setAttribute("display", "none");
  taskElement.addEventListener("dragstart", dragStart);
  taskElement.addEventListener("dragend", dragEnd);

  textContainer.appendChild(textDiv);
  taskElement.appendChild(textContainer);
  taskElement.appendChild(actionContainer);
  textContainer.appendChild(dateElement);
  actionContainer.appendChild(editButton);
  actionContainer.appendChild(deleteButton);
  actionContainer.appendChild(cardId);
  return taskElement;
}

function dragStart() {
  this.classList.add("dragging");
  // console.log(this.parentElement.id);
}

function dragEnd() {
  const boardNames = getAllBoardNames();
  const allBoardNames = [];
  boardNames.forEach((board) => {
    allBoardNames.push(board.id);
  });
  console.log(this.parentElement.id);
  this.classList.remove("dragging");
  allBoardNames.forEach((colId) => {
    updateTasksCount(colId.replace("-tasks", ""));
  });
  updateLocalStorage();
}

function getAllBoardNames() {
  const boardNames = [];
  const getAllBoards = document.querySelectorAll(".board .tasks");

  getAllBoards.forEach((board) => {
    boardNames.push(board.id);
  });
  return getAllBoards;
}

// Database operations
function updateTasksCount(colId) {
  const tasksCount = document.querySelectorAll(`#${colId}-tasks .card`).length;

  document.getElementById(`${colId}-count`).textContent = tasksCount;
}
