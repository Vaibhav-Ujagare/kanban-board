document.addEventListener("DOMContentLoaded", loadTasksFromLocalStorage);

const addNewBoard = document.querySelector(".addNewBoard");
const removeBoard = document.querySelector(".removeBoard");
const boards = document.querySelector(".boards");

removeBoard.addEventListener("click", function () {
  const input = prompt("Enter Board Name To Delete");
  if (!input) {
    return;
  }
  localStorage.removeItem(input.toUpperCase());
  location.reload();
});

addNewBoard.addEventListener("click", () => {
  let input = prompt("Enter the board name");
  input = input.toUpperCase();
  if (!input) {
    return;
  }
  createNewBoard(input);
  const now = new Date().toLocaleString();
  saveBoardsToLocalStorage(input, now);
});

function saveBoardsToLocalStorage(colId, boardCreationDate) {
  const boards = [];
  boards.push({ colId: colId, boardCreationDate: boardCreationDate });
  localStorage.setItem(colId, JSON.stringify(boards));
}

function createNewBoard(input) {
  const newBoard = document.createElement("board");
  const newBoardTitle = document.createElement("h1");
  const newBoardTasks = document.createElement("div");
  const newBoardInput = document.createElement("input");
  const newBoardButton = document.createElement("button");

  newBoard.setAttribute("id", `${input}`);
  newBoard.classList.add("board");
  // newBoard.draggable = true;

  newBoardTitle.innerHTML = `${input} (<span id=${input}-count>0</span>)`;

  newBoardTasks.classList.add("tasks");
  newBoardTasks.setAttribute("id", `${input}-tasks`);

  newBoardInput.classList.add(`tasks-input`);
  newBoardInput.setAttribute("id", `${input}-input`);
  newBoardInput.type = "text";
  newBoardInput.placeholder = "Enter Task";

  newBoardButton.classList.add("add-tasks");
  newBoardButton.innerHTML = "Add Task";
  newBoardButton.onclick = function () {
    addTask(input);
  };

  newBoard.appendChild(newBoardTitle);
  newBoard.appendChild(newBoardTasks);
  newBoard.appendChild(newBoardInput);
  newBoard.appendChild(newBoardButton);
  boards.appendChild(newBoard);

  const allBoards = document.querySelectorAll(".tasks");
  allBoards.forEach((board) => {
    board.addEventListener("dragover", dragOver);
  });
}

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

  const taskElement = createTaskElement(taskText);

  document.getElementById(`${colId}-tasks`).appendChild(taskElement);
  updateTasksCount(colId);
  const taskDate = taskElement.querySelector("small").innerText;

  saveTasksToLocalStorage(colId, taskText, taskDate);

  input.value = "";
}

function saveTasksToLocalStorage(colId, taskText, taskDate) {
  const tasks = JSON.parse(localStorage.getItem(colId)) || [];
  tasks.push({
    text: taskText,
    date: taskDate || new Date().toLocaleString(),
  });
  localStorage.setItem(colId, JSON.stringify(tasks));
}

function loadTasksFromLocalStorage() {
  const keys = Object.keys(localStorage);
  // console.log(keys);
  keys.forEach((colId) => {
    if (!document.getElementById(`${colId}-tasks`) && colId !== "BoardsName") {
      createNewBoard(colId);
    }

    const tasks = JSON.parse(localStorage.getItem(colId)) || [];
    tasks.forEach(({ boardCreationDate, text, date }) => {
      if (!boardCreationDate) {
        const taskElement = createTaskElement(text);
        taskElement.querySelector("small").innerText = `${date} `;
        document.getElementById(`${colId}-tasks`).appendChild(taskElement);
      }
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
      const text = task.querySelector("p").innerText;
      const date = task.querySelector("small").innerText;
      tasks.push({ text, date });
    });

    localStorage.setItem(colId, JSON.stringify(tasks));
  });
}

function createTaskElement(taskText) {
  const taskElement = document.createElement("div");
  const textContainer = document.createElement("div");
  const actionContainer = document.createElement("div");
  const editButton = document.createElement("button");
  const deleteButton = document.createElement("button");
  const textElement = document.createElement("p");
  const dateElement = document.createElement("small");

  textContainer.classList.add("task-text");
  actionContainer.classList.add("task-actions");
  editButton.classList.add("edit-task");
  deleteButton.classList.add("delete-task");
  taskElement.classList.add("card");

  const todoAddedDate = new Date().toLocaleString();
  dateElement.innerText = `Task Added in TODO: ${todoAddedDate}`;

 
  textElement.innerText = taskText;
  editButton.innerText = "Edit";
  deleteButton.innerText = "Delete";

  editButton.addEventListener("click", function () {
    const newText = prompt("Enter new text", textElement.textContent);

    if (!newText) {
      return;
    }
    textElement.textContent = newText;
    updateLocalStorage();
  });

  deleteButton.addEventListener("click", function () {
    const colId = taskElement.parentElement.id.replace("-tasks", "");
    taskElement.remove();
    updateTasksCount(colId);
    updateLocalStorage();
  });

  taskElement.setAttribute("draggable", true);
  taskElement.addEventListener("dragstart", dragStart);
  taskElement.addEventListener("dragend", dragEnd);

  textContainer.appendChild(textElement);
  taskElement.appendChild(textContainer);
  taskElement.appendChild(actionContainer);
  textContainer.appendChild(dateElement);
  actionContainer.appendChild(editButton);
  actionContainer.appendChild(deleteButton);
  return taskElement;
}

function dragStart() {
  this.classList.add("dragging");
  console.log(this.parentElement.id);
}

function dragEnd() {
  const boardNames = getAllBoardNames();
  const allBoardNames = [];
  boardNames.forEach((board) => {
    allBoardNames.push(board.id);
  });
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
